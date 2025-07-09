import { EventEmitter } from "node:events";
import * as fs from "node:fs";
import WebTorrent from "webtorrent";
import {
	type DownloadItem,
	type DownloadProgress,
	DownloadStatus,
} from "@/@types";
import { SettingsManager } from "../../../handlers/settings/settings";
import { downloadQueue } from "../queue";

const settings = SettingsManager.getInstance();

/**
 * Class that handles torrent downloads using WebTorrent
 */
export class TorrentDownloadHandler extends EventEmitter {
	private client: WebTorrent.Instance;
	private torrents: Map<string, WebTorrent.Torrent>;
	private progressIntervals: Map<string, NodeJS.Timeout>;

	constructor() {
		super();
		this.torrents = new Map();
		this.progressIntervals = new Map();

		this.client = new WebTorrent({
			utp: true,
			dht: true,
			webSeeds: false,
			tracker: {
				announce: [],
				rtcConfig: null,
			},
			maxConns: 80,
			blocklist:
				"https://github.com/Naunter/BT_BlockLists/raw/master/bt_blocklists.gz",
		});

		// Apply throttling settings
		this.applyThrottlingSettings();

		// Setup event listeners
		this.setupEventListeners();
	}

	/**
	 * Apply throttling settings from user configuration
	 */
	private applyThrottlingSettings(): void {
		const maxDownloadSpeed: number = settings.get("maxDownloadSpeed") as number;
		const maxUploadSpeed: number = settings.get("maxUploadSpeed") as number;

		if (maxDownloadSpeed && maxDownloadSpeed > 0) {
			console.log(
				"Applying throttling settings:",
				maxDownloadSpeed,
				maxUploadSpeed,
			);
			this.client.throttleDownload(maxDownloadSpeed * 1024); // Convert to bytes/sec
		}

		if (maxUploadSpeed && maxUploadSpeed > 0) {
			console.log(
				"Applying throttling settings:",
				maxDownloadSpeed,
				maxUploadSpeed,
			);
			this.client.throttleUpload(maxUploadSpeed * 1024); // Convert to bytes/sec
		}
	}

	/**
	 * Setup event listeners for the WebTorrent client
	 */
	private setupEventListeners(): void {
		// Listen for client errors
		this.client.on("error", (error) => {
			console.error(
				"WebTorrent client error:",
				typeof error === "string" ? error : error.message,
			);
		});
	}

	/**
	 * Start a torrent download
	 */
	public async startDownload(item: DownloadItem): Promise<void> {
		try {
			// Check if torrent already exists
			if (this.torrents.has(item.id)) {
				console.warn(`Torrent ${item.id} already exists, skipping`);
				return;
			}

			// Check if this URL is already being downloaded by another torrent
			const existingTorrent = this.client.torrents.find(
				(t) => t.magnetURI === item.url || t.infoHash === item.url,
			);
			if (existingTorrent) {
				console.log(
					`Torrent with URL ${item.url} already exists, reusing existing torrent`,
				);
				this.torrents.set(item.id, existingTorrent);
				this.setupTorrentEventListeners(existingTorrent, item.id);
				this.startProgressTracking(item.id);
				return;
			}

			// Create directory if it doesn't exist
			await fs.promises.mkdir(item.path, { recursive: true, mode: 0o755 });

			// Send initial progress update to prevent UI stuck state
			downloadQueue.updateProgress({
				id: item.id,
				progress: 0,
				speed: 0,
				timeRemaining: 0,
				status: DownloadStatus.DOWNLOADING,
			});

			// Add torrent to client with error handling
			const torrent = this.client.add(item.url, { path: item.path });

			// Store torrent reference immediately
			this.torrents.set(item.id, torrent);

			// Setup torrent event listeners first
			this.setupTorrentEventListeners(torrent, item.id);

			// Handle torrent ready event
			torrent.on("ready", () => {
				console.log(
					`Torrent ${item.id} is ready:`,
					torrent.name,
					torrent.length,
				);

				// Update item with torrent info
				item.name = torrent.name;
				item.size = torrent.length;

				// Update download queue with torrent metadata
				const download = downloadQueue.getDownload(item.id);
				if (download) {
					download.name = torrent.name;
					download.size = torrent.length;
				}

				// Send immediate metadata update
				const metadataUpdate: DownloadProgress = {
					id: item.id,
					progress: 0,
					speed: 0,
					timeRemaining: 0,
					status: DownloadStatus.DOWNLOADING,
				};
				downloadQueue.updateProgress(metadataUpdate);

				// Start progress tracking
				this.startProgressTracking(item.id);
			});

			// Start progress tracking immediately for UI responsiveness
			this.startProgressTracking(item.id);
		} catch (error) {
			this.handleError(
				item.id,
				error instanceof Error ? error.message : "Unknown error",
			);
		}
	}

	/**
	 * Setup event listeners for a specific torrent
	 */
	private setupTorrentEventListeners(
		torrent: WebTorrent.Torrent,
		id: string,
	): void {
		// Handle torrent errors
		torrent.on("error", (error) => {
			console.error(`Torrent ${id} error:`, error);
			this.handleError(id, typeof error === "string" ? error : error.message);
		});

		// Handle torrent completion
		torrent.on("done", () => {
			console.log(`Torrent ${id} completed`);
			this.completeDownload(id);
		});

		// Handle metadata received
		torrent.on("metadata", () => {
			console.log(
				`Torrent ${id} metadata received:`,
				torrent.name,
				torrent.length,
			);
			const item = downloadQueue.getDownload(id);
			if (item) {
				item.name = torrent.name;
				item.size = torrent.length;

				// Send progress update with metadata
				const metadataUpdate: DownloadProgress = {
					id,
					progress: 0,
					speed: 0,
					timeRemaining: 0,
					status: DownloadStatus.DOWNLOADING,
				};
				downloadQueue.updateProgress(metadataUpdate);
			}
		});

		// Throttled download event to prevent spam
		let lastDownloadLog = 0;
		torrent.on("download", () => {
			// Throttle progress updates to avoid overwhelming the UI
			if (!this.progressIntervals.has(id)) {
				this.updateProgress(id);
			}

			// Log progress occasionally for debugging
			const now = Date.now();
			if (now - lastDownloadLog > 5000) {
				// Log every 5 seconds max
				console.log(`Torrent ${id} downloading:`, {
					progress: `${(torrent.progress * 100).toFixed(2)}%`,
					speed: torrent.downloadSpeed,
					downloaded: torrent.downloaded,
					length: torrent.length,
				});
				lastDownloadLog = now;
			}
		});

		// Handle wire connections
		torrent.on("wire", (wire) => {
			console.log(`Torrent ${id} connected to peer:`, wire.remoteAddress);
		});

		torrent.on("upload", () => {
			// Update progress with upload statistics for seeding torrents
			const download = downloadQueue.getDownload(id);
			if (download && download.status === DownloadStatus.SEEDING) {
				const progressUpdate: DownloadProgress = {
					id,
					progress: 100,
					speed: 0,
					timeRemaining: 0,
					status: DownloadStatus.SEEDING,
					uploadSpeed: torrent.uploadSpeed,
					uploaded: torrent.uploaded,
					peers: torrent.numPeers,
				};
				downloadQueue.updateProgress(progressUpdate);
			}

			// Only log upload progress occasionally
			const now = Date.now();
			if (now - lastDownloadLog > 5000) {
				console.log(`Torrent ${id} uploading:`, {
					uploadSpeed: torrent.uploadSpeed,
					uploaded: torrent.uploaded,
					peers: torrent.numPeers,
				});
				lastDownloadLog = now;
			}
		});
	}

	/**
	 * Start tracking progress for a torrent
	 */
	private startProgressTracking(id: string): void {
		// Clear any existing interval
		this.stopProgressTracking(id);

		// Send immediate update to prevent stuck state
		this.updateProgress(id);

		// Start new interval - 2000ms for better performance
		const interval = setInterval(() => {
			const torrent = this.torrents.get(id);
			if (!torrent) return;

			// Check if torrent is seeding
			const download = downloadQueue.getDownload(id);
			if (download?.status === DownloadStatus.SEEDING) {
				// Update one last time before stopping
				this.updateProgress(id);
				// Stop progress tracking for seeding torrents
				this.stopProgressTracking(id);
				return;
			}

			this.updateProgress(id);
		}, 2000);

		// Store interval reference
		this.progressIntervals.set(id, interval);
	}

	/**
	 * Stop tracking progress for a torrent
	 */
	private stopProgressTracking(id: string): void {
		const interval = this.progressIntervals.get(id);
		if (interval) {
			clearInterval(interval);
			this.progressIntervals.delete(id);
		}
	}

	/**
	 * Update download progress
	 */
	private updateProgress(id: string): void {
		const torrent = this.torrents.get(id);
		const download = downloadQueue.getDownload(id);

		// Check if torrent and download exist
		if (!torrent || !download) {
			console.warn(`Torrent or download ${id} not found for progress update`);
			return;
		}

		// Don't update progress for paused or cancelled downloads
		if (
			download.status === DownloadStatus.PAUSED ||
			download.status === DownloadStatus.CANCELLED
		) {
			return;
		}

		// Always send updates for torrents that are not ready yet to prevent stuck state
		if (!torrent.ready || torrent.length === 0) {
			// Send a basic update to show the download is active
			const basicUpdate: DownloadProgress = {
				id,
				progress: 0,
				speed: 0,
				timeRemaining: 0,
				status: DownloadStatus.DOWNLOADING,
			};
			downloadQueue.updateProgress(basicUpdate);
			return;
		}

		// Calculate progress with validation
		const progress = Math.min((torrent.downloaded / torrent.length) * 100, 100);
		const speed = torrent.downloadSpeed || 0;

		// Calculate time remaining with validation
		let timeRemaining = 0;
		if (speed > 0 && torrent.length > 0) {
			const remainingBytes = torrent.length - torrent.downloaded;
			timeRemaining = Math.max(remainingBytes / speed, 0);
		}

		// Determine if the torrent is completed and should be seeding
		const isSeeding =
			torrent.progress === 1 || download.status === DownloadStatus.SEEDING;

		// Only send updates if there's meaningful change or it's the first update
		const lastProgress = download.progress || 0;
		const lastSpeed = download.speed || 0;
		const progressDiff = Math.abs(progress - lastProgress);
		const speedDiff = Math.abs(speed - lastSpeed);

		// Send update if progress changed by at least 0.1%, speed changed significantly, or it's the first real update
		if (
			progressDiff >= 0.1 ||
			speedDiff > 1024 ||
			lastProgress === 0 ||
			isSeeding
		) {
			const progressUpdate: DownloadProgress = {
				id,
				progress: Math.round(progress * 100) / 100, // Round to 2 decimal places
				speed,
				timeRemaining: Math.round(timeRemaining),
				status: isSeeding ? DownloadStatus.SEEDING : DownloadStatus.DOWNLOADING,
				uploadSpeed: torrent.uploadSpeed,
				uploaded: torrent.uploaded,
				peers: torrent.numPeers,
			};

			// Update download queue
			downloadQueue.updateProgress(progressUpdate);
		}
	}

	/**
	 * Complete a download
	 */
	private completeDownload(id: string): void {
		// Get the torrent instance
		const torrent = this.torrents.get(id);
		if (!torrent) {
			console.warn(`Torrent ${id} not found for completion`);
			return;
		}

		console.log(`Torrent ${id} completed`);

		// Create progress update for completion and start seeding
		const progressUpdate: DownloadProgress = {
			id,
			progress: 100,
			speed: 0,
			timeRemaining: 0,
			status: DownloadStatus.SEEDING,
			uploadSpeed: torrent.uploadSpeed,
			uploaded: torrent.uploaded,
			peers: torrent.numPeers,
		};

		// Update download queue
		downloadQueue.updateProgress(progressUpdate);

		// Log initial seeding state
		console.log(`Torrent ${id} started seeding:`, {
			uploadSpeed: torrent.uploadSpeed,
			uploaded: torrent.uploaded,
			peers: torrent.numPeers,
		});
	}

	/**
	 * Handle download error
	 */
	private handleError(id: string, errorMessage: string): void {
		// Stop progress tracking
		this.stopProgressTracking(id);

		// Create progress update for failure
		const progressUpdate: DownloadProgress = {
			id,
			progress: 0,
			speed: 0,
			timeRemaining: 0,
			status: DownloadStatus.FAILED,
			error: errorMessage, // Use the errorMessage parameter
		};

		// Update download queue with error
		downloadQueue.updateProgress(progressUpdate);

		// Remove torrent
		this.removeTorrent(id);
	}

	/**
	 * Pause a download
	 */
	public pauseDownload(id: string): boolean {
		const torrent = this.torrents.get(id);
		if (!torrent) {
			console.warn(`Torrent ${id} not found for pause`);
			return false;
		}

		console.log(`Pausing torrent ${id}`);

		// Pause the torrent
		torrent.pause();

		// Send a progress update with paused status to ensure UI shows it as paused
		const progressUpdate: DownloadProgress = {
			id,
			progress: torrent.progress * 100,
			speed: 0,
			timeRemaining: 0,
			status: DownloadStatus.PAUSED,
			uploadSpeed: 0,
			uploaded: torrent.uploaded,
			peers: torrent.numPeers,
		};

		// Update download queue with paused status
		downloadQueue.updateProgress(progressUpdate);

		// Stop progress tracking
		this.stopProgressTracking(id);

		return true;
	}

	/**
	 * Resume a download
	 */
	public resumeDownload(id: string): boolean {
		const torrent = this.torrents.get(id);
		if (!torrent) {
			console.warn(`Torrent ${id} not found for resume`);
			return false;
		}

		console.log(`Resuming torrent ${id}`);

		// Resume the torrent
		torrent.resume();

		// Determine if the torrent is completed and should be seeding
		const isCompleted = torrent.progress === 1;

		// Send immediate status update
		const progressUpdate: DownloadProgress = {
			id,
			progress:
				torrent.length > 0 ? (torrent.downloaded / torrent.length) * 100 : 0,
			speed: torrent.downloadSpeed || 0,
			timeRemaining: 0,
			status: isCompleted ? DownloadStatus.SEEDING : DownloadStatus.DOWNLOADING,
			uploadSpeed: torrent.uploadSpeed,
			uploaded: torrent.uploaded,
			peers: torrent.numPeers,
		};

		downloadQueue.updateProgress(progressUpdate);

		// Start progress tracking
		this.startProgressTracking(id);

		return true;
	}

	/**
	 * Cancel a download
	 */
	public cancelDownload(id: string): boolean {
		const torrent = this.torrents.get(id);
		if (torrent) {
			console.log(`Cancelling torrent ${id}`);

			// Send immediate status update
			const progressUpdate: DownloadProgress = {
				id,
				progress:
					torrent.length > 0 ? (torrent.downloaded / torrent.length) * 100 : 0,
				speed: 0,
				timeRemaining: 0,
				status: DownloadStatus.CANCELLED,
			};

			downloadQueue.updateProgress(progressUpdate);
		}

		return this.removeTorrent(id);
	}

	/**
	 * Remove a torrent
	 */
	private removeTorrent(id: string): boolean {
		const torrent = this.torrents.get(id);
		if (!torrent) return false;

		// Stop progress tracking
		this.stopProgressTracking(id);

		// Remove torrent from client
		torrent.destroy();

		// Remove from torrents map
		this.torrents.delete(id);

		return true;
	}

	/**
	 * Update throttling settings
	 */
	public updateThrottling(downloadSpeed?: number, uploadSpeed?: number): void {
		if (downloadSpeed !== undefined) {
			if (downloadSpeed > 0) {
				this.client.throttleDownload(downloadSpeed * 1024); // Convert to bytes/sec
			} else {
				this.client.throttleDownload(0); // No limit
			}
		}

		if (uploadSpeed !== undefined) {
			if (uploadSpeed > 0) {
				this.client.throttleUpload(uploadSpeed * 1024); // Convert to bytes/sec
			} else {
				this.client.throttleUpload(0); // No limit
			}
		}
	}

	/**
	 * Get all active torrents
	 */
	public getActiveTorrents(): { id: string; torrent: WebTorrent.Torrent }[] {
		return Array.from(this.torrents.entries()).map(([id, torrent]) => ({
			id,
			torrent,
		}));
	}

	public destroy(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (this.progressIntervals) {
				for (const id of this.progressIntervals.keys()) {
					this.stopProgressTracking(id);
				}
			}

			this.client.destroy((err) => {
				if (err) {
					console.error("Error destroying WebTorrent client:", err);
					return reject(err instanceof Error ? err : new Error(String(err)));
				}
				this.torrents.clear();
				this.removeAllListeners();
				resolve();
			});
		});
	}
}

// Create and export singleton instance
export const torrentDownloadHandler = new TorrentDownloadHandler();
