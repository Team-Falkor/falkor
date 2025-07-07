import { EventEmitter } from "node:events";
import { getErrorMessage } from "@backend/utils/utils";
import {
	type AddDownloadOptions,
	type DownloadItem,
	type DownloadPriority,
	type DownloadProgress,
	type DownloadQueueConfig,
	DownloadStatus,
	type SettingsConfig,
} from "@/@types";
import { constants } from "../../../utils/constants";
import { uuidv4 } from "../../../utils/uuid";
import { SettingsManager } from "../../settings/settings";
import type { HttpDownloadHandler } from "../http";
import type { TorrentDownloadHandler } from "../torrent";

const settings = SettingsManager.getInstance();

export const DEFAULT_QUEUE_CONFIG: DownloadQueueConfig = {
	maxConcurrentDownloads: 3,
	maxRetries: 3,
	retryDelay: 5000,
	persistQueue: true,
};

class DownloadQueue extends EventEmitter {
	private static instance: DownloadQueue;
	private queue: Map<string, DownloadItem>;
	private activeDownloads: Set<string>;
	private priorityQueue: Map<DownloadPriority, string[]>;
	private config: DownloadQueueConfig;
	private handlers: Map<
		"http" | "torrent",
		HttpDownloadHandler | TorrentDownloadHandler
	>;

	private constructor() {
		super();
		this.queue = new Map();
		this.activeDownloads = new Set();
		this.priorityQueue = new Map([
			["high", []],
			["normal", []],
			["low", []],
		]);
		this.config = { ...DEFAULT_QUEUE_CONFIG };
		this.handlers = new Map();
		this.loadConfig();
		this.setupEventListeners();
		this.setupCleanupInterval();
	}

	public static getInstance(): DownloadQueue {
		if (!DownloadQueue.instance) {
			DownloadQueue.instance = new DownloadQueue();
		}
		return DownloadQueue.instance;
	}

	private loadConfig(): void {
		const savedConfig = settings.get(
			"downloadConfig",
		) as SettingsConfig["downloadConfig"];
		if (savedConfig) {
			this.config = { ...DEFAULT_QUEUE_CONFIG, ...savedConfig };
		}
	}

	private saveConfig(): void {
		settings.update(
			"downloadConfig",
			this.config as SettingsConfig["downloadConfig"],
		);
	}

	private setupEventListeners(): void {
		// Set up error event listener to prevent unhandled promise rejections
		this.on("error", (id, errorMessage) => {
			console.error(`Download error for ${id}: ${errorMessage}`);
			// Error is already handled in handleDownloadError, this just prevents unhandled rejections
		});
	}

	private setupCleanupInterval(): void {
		// Clean up stale downloads every 30 seconds
		setInterval(() => {
			this.cleanupStaleDownloads();
		}, 30000);
	}

	private cleanupStaleDownloads(): void {
		try {
			const now = Date.now();
			const staleThreshold = 5 * 60 * 1000; // 5 minutes

			for (const [id, download] of this.queue.entries()) {
				// Check for downloads that have been "downloading" for too long without progress
				if (
					download.status === DownloadStatus.DOWNLOADING &&
					download.started &&
					now - download.started.getTime() > staleThreshold &&
					(download.progress || 0) === 0
				) {
					console.warn(`Cleaning up stale download: ${id}`);
					this.handleDownloadError(
						id,
						"Download appears to be stale and will be restarted",
					);
				}
			}

			// Sync active downloads with actual download states
			for (const id of this.activeDownloads) {
				const download = this.queue.get(id);
				if (!download || download.status !== DownloadStatus.DOWNLOADING) {
					console.warn(
						`Removing ${id} from active downloads - status mismatch`,
					);
					this.activeDownloads.delete(id);
				}
			}
		} catch (error) {
			console.error("Error during cleanup:", error);
		}
	}

	public registerHandler(
		type: "http" | "torrent",
		handler: HttpDownloadHandler | TorrentDownloadHandler,
	): void {
		this.handlers.set(type, handler);
	}

	public async addDownload(options: AddDownloadOptions): Promise<string> {
		const id = uuidv4();
		const now = new Date();
		const downloadsPath =
			settings.get("downloadsPath") ?? constants.downloadsPath;
		const downloadItem: DownloadItem = {
			id,
			url: options.url,
			type: options.type,
			name: options.name || `Download-${id.substring(0, 8)}`,
			path: options.path || downloadsPath?.toString(),
			status: DownloadStatus.QUEUED,
			progress: 0,
			speed: 0,
			size: 0,
			timeRemaining: 0,
			paused: !options.autoStart,
			game_data: options.game_data,
			created: now,
		};
		this.queue.set(id, downloadItem);
		const priority = options.priority || "normal";
		this.priorityQueue.get(priority)?.push(id);
		this.emitStateChange(id, DownloadStatus.NONE, DownloadStatus.QUEUED);
		if (options.autoStart !== false) {
			this.processQueue();
		}
		return id;
	}

	private async processQueue(): Promise<void> {
		// Log the current download status
		console.log(
			`Active downloads: ${this.activeDownloads.size}, Max allowed: ${this.config.maxConcurrentDownloads}`,
		);

		// Check if we're at max capacity
		const atMaxCapacity =
			this.activeDownloads.size >= this.config.maxConcurrentDownloads;

		// If we're at max capacity, we should still process the queue to ensure items are properly queued
		// But we won't start any new downloads until active count drops below max
		for (const priority of ["high", "normal", "low"] as DownloadPriority[]) {
			const priorityQueue = this.priorityQueue.get(priority) || [];
			for (let i = 0; i < priorityQueue.length; i++) {
				const id = priorityQueue[i];
				const download = this.queue.get(id);
				if (!download) continue;
				if (this.activeDownloads.has(id) || download.paused) continue;
				if (download.status !== DownloadStatus.QUEUED) continue;

				// Only start the download if we're below max capacity
				if (!atMaxCapacity) {
					await this.startDownload(id);
				}

				// Check if we've reached max capacity after starting this download
				if (this.activeDownloads.size >= this.config.maxConcurrentDownloads) {
					break;
				}
			}
			if (this.activeDownloads.size >= this.config.maxConcurrentDownloads) {
				break;
			}
		}
	}

	private async startDownload(id: string): Promise<void> {
		const download = this.queue.get(id);
		if (!download) {
			console.warn(`Download ${id} not found when trying to start`);
			return;
		}

		// Check if download is already active
		if (this.activeDownloads.has(id)) {
			console.warn(`Download ${id} is already active`);
			return;
		}

		const handler = this.handlers.get(download.type);
		if (!handler) {
			this.handleDownloadError(
				id,
				`No handler registered for ${download.type} downloads`,
			);
			return;
		}

		// Mark as active before starting to prevent race conditions
		this.activeDownloads.add(id);
		download.status = DownloadStatus.DOWNLOADING;
		download.started = new Date();
		this.emitStateChange(id, DownloadStatus.QUEUED, DownloadStatus.DOWNLOADING);

		try {
			await handler.startDownload(download);
		} catch (error) {
			// Remove from active downloads on error
			this.activeDownloads.delete(id);
			this.handleDownloadError(id, getErrorMessage(error));
		}
	}

	public async pauseDownload(id: string): Promise<boolean> {
		const download = this.queue.get(id);
		if (!download) return false;
		if (download.status !== DownloadStatus.DOWNLOADING) {
			return false;
		}
		const previousStatus = download.status;

		// Update status immediately to prevent race conditions
		download.status = DownloadStatus.PAUSED;
		download.paused = true;
		this.activeDownloads.delete(id);

		// Remove from all priority queues to prevent re-processing
		for (const queue of this.priorityQueue.values()) {
			const index = queue.indexOf(id);
			if (index !== -1) {
				queue.splice(index, 1);
			}
		}

		// Emit state change immediately for UI responsiveness
		this.emitStateChange(id, previousStatus, DownloadStatus.PAUSED);

		// Stop the download through the handler if available
		const handler = this.handlers.get(download.type);
		if (handler && typeof handler.pauseDownload === "function") {
			try {
				await handler.pauseDownload(id);
			} catch (error) {
				console.error(`Error pausing download ${id}: ${error}`);
				// Revert status if handler fails
				download.status = previousStatus;
				download.paused = false;
				this.activeDownloads.add(id);
				this.emitStateChange(id, DownloadStatus.PAUSED, previousStatus);
				return false;
			}
		}

		// Process queue after ensuring download is fully stopped
		setImmediate(() => this.processQueue());
		return true;
	}

	public resumeDownload(id: string): boolean {
		const download = this.queue.get(id);
		if (!download) return false;
		if (
			download.status !== DownloadStatus.PAUSED &&
			download.status !== DownloadStatus.FAILED
		) {
			return false;
		}

		const previousStatus = download.status;

		// Update status immediately
		download.status = DownloadStatus.QUEUED;
		download.paused = false;

		// Reset error state if resuming from failed
		if (previousStatus === DownloadStatus.FAILED) {
			download.error = undefined;
		}

		// Add back to priority queue when resuming
		const priority = download.priority || "normal";
		const priorityQueue = this.priorityQueue.get(priority);
		if (priorityQueue && !priorityQueue.includes(id)) {
			priorityQueue.push(id);
		}

		// Emit state change immediately for UI responsiveness
		this.emitStateChange(id, previousStatus, DownloadStatus.QUEUED);

		// Process queue asynchronously
		setImmediate(() => this.processQueue());
		return true;
	}

	public cancelDownload(id: string): boolean {
		const download = this.queue.get(id);
		if (!download) return false;
		const previousStatus = download.status;
		download.status = DownloadStatus.CANCELLED;
		this.activeDownloads.delete(id);
		for (const [_priority, queue] of this.priorityQueue.entries()) {
			const index = queue.indexOf(id);
			if (index !== -1) {
				queue.splice(index, 1);
				break;
			}
		}
		const handler = this.handlers.get(download.type);
		if (handler && typeof handler.cancelDownload === "function") {
			try {
				handler.cancelDownload(id);
			} catch (error) {
				console.error(`Error canceling download ${id}: ${error}`);
			}
		}
		this.emitStateChange(id, previousStatus, DownloadStatus.CANCELLED);
		this.processQueue();
		return true;
	}

	public removeDownload(id: string): boolean {
		if (this.activeDownloads.has(id)) {
			this.cancelDownload(id);
		}
		const result = this.queue.delete(id);
		return result;
	}

	public removeAllDownloads(): void {
		for (const id of this.queue.keys()) {
			this.removeDownload(id);
		}
	}

	public clearCompletedDownloads(): number {
		let count = 0;
		for (const [id, download] of this.queue.entries()) {
			if (
				download.status === DownloadStatus.COMPLETED ||
				download.status === DownloadStatus.FAILED ||
				download.status === DownloadStatus.CANCELLED
			) {
				this.queue.delete(id);
				count++;
			}
		}
		return count;
	}

	public getDownloads(): DownloadItem[] {
		return Array.from(this.queue.values());
	}

	public getDownload(id: string): DownloadItem | undefined {
		return this.queue.get(id);
	}

	public setPriority(id: string, priority: DownloadPriority): boolean {
		const download = this.queue.get(id);
		if (!download) return false;
		for (const [_currentPriority, queue] of this.priorityQueue.entries()) {
			const index = queue.indexOf(id);
			if (index !== -1) {
				queue.splice(index, 1);
				break;
			}
		}
		this.priorityQueue.get(priority)?.push(id);
		return true;
	}

	public updateProgress(progress: DownloadProgress): void {
		const download = this.queue.get(progress.id);
		if (!download) return;

		// Store previous values for comparison
		const previousStatus = download.status;
		const previousProgress = download.progress;

		// Update download properties
		download.progress = progress.progress;
		download.speed = progress.speed;
		download.timeRemaining = progress.timeRemaining;

		// Handle status changes
		if (progress.status !== download.status) {
			download.status = progress.status;
			this.emitStateChange(progress.id, previousStatus, progress.status);

			if (progress.status === DownloadStatus.COMPLETED) {
				download.completed = new Date();
				this.activeDownloads.delete(progress.id);
				// Remove from priority queues
				for (const queue of this.priorityQueue.values()) {
					const index = queue.indexOf(progress.id);
					if (index !== -1) {
						queue.splice(index, 1);
					}
				}
				setImmediate(() => this.processQueue());
			} else if (
				progress.status === DownloadStatus.FAILED ||
				progress.status === DownloadStatus.CANCELLED
			) {
				this.activeDownloads.delete(progress.id);
				// Remove from priority queues
				for (const queue of this.priorityQueue.values()) {
					const index = queue.indexOf(progress.id);
					if (index !== -1) {
						queue.splice(index, 1);
					}
				}
				if (progress.error) {
					download.error = progress.error;
				}
				setImmediate(() => this.processQueue());
			}
		}

		// Only emit progress if there's meaningful change (avoid UI spam)
		const progressDiff = Math.abs(
			(progress.progress || 0) - (previousProgress || 0),
		);
		if (progressDiff >= 0.1 || progress.status !== previousStatus) {
			console.log('Emitting progress event for download:', progress.id, 'progress:', progress.progress);
			this.emit("progress", download);
		}
	}

	public handleDownloadError(id: string, errorMessage: string): void {
		const download = this.queue.get(id);
		if (!download) return;

		const previousStatus = download.status;
		download.status = DownloadStatus.FAILED;
		download.error = errorMessage;
		this.activeDownloads.delete(id);

		// Remove from priority queues
		for (const queue of this.priorityQueue.values()) {
			const index = queue.indexOf(id);
			if (index !== -1) {
				queue.splice(index, 1);
			}
		}

		// Clean up handler state
		const handler = this.handlers.get(download.type);
		if (handler && typeof handler.cancelDownload === "function") {
			try {
				handler.cancelDownload(id);
			} catch (error) {
				console.warn(`Error cleaning up failed download ${id}:`, error);
			}
		}

		this.emit("error", id, errorMessage);
		this.emitStateChange(id, previousStatus, DownloadStatus.FAILED);

		// Process queue asynchronously
		setImmediate(() => {
			this.processQueue();
		});
	}

	private emitStateChange(
		id: string,
		previousStatus: DownloadStatus,
		currentStatus: DownloadStatus,
	): void {
		const download = this.queue.get(id);
		if (download) {
			console.log('Emitting state change event for download:', id, 'from:', previousStatus, 'to:', currentStatus);
			this.emit("stateChange", download);
		}
	}

	public updateConfig(config: Partial<DownloadQueueConfig>): void {
		this.config = { ...this.config, ...config };
		this.saveConfig();
		this.processQueue();
	}

	public async destroy(): Promise<void> {
		this.removeAllDownloads();

		const handlerDestroyPromises: Promise<void>[] = [];
		for (const handler of this.handlers.values()) {
			const promise = handler.destroy();
			if (promise instanceof Promise) {
				handlerDestroyPromises.push(promise);
			}
		}
		await Promise.all(handlerDestroyPromises);

		this.queue.clear();
		this.activeDownloads.clear();
		this.priorityQueue.clear();
		this.handlers.clear();

		this.removeAllListeners();
	}
}

export const downloadQueue = DownloadQueue.getInstance();
