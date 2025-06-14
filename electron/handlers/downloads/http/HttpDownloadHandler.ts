import * as fs from "node:fs";
import * as path from "node:path";
import { getErrorMessage } from "@backend/utils/utils";
import {
	type DownloadItem,
	type DownloadProgress,
	DownloadStatus,
} from "@/@types";
import { downloadQueue } from "../queue";
import { DownloaderTask } from "./DownloaderTask";
import type { DownloadRetryState } from "./types";

/**
 * Orchestrates all download operations. It manages a pool of DownloaderTask
 * instances, handles retries, and communicates state changes to the global
 * download queue.
 */
export class HttpDownloadHandler {
	private tasks = new Map<string, DownloaderTask>();
	private retryStates = new Map<string, DownloadRetryState>();
	private readonly MAX_RETRIES = 3;

	/**
	 * Starts or resumes a download.
	 */
	public async startDownload(item: DownloadItem): Promise<void> {
		if (this.tasks.has(item.id)) {
			console.warn(`Download ${item.id} is already active.`);
			return;
		}

		try {
			await fs.promises.mkdir(item.path, { recursive: true, mode: 0o755 });

			const filePath = path.join(item.path, item.name);
			let existingSize = 0;
			try {
				const stats = await fs.promises.stat(filePath);
				existingSize = stats.size;
			} catch (err) {
				console.error(`Failed to stat file: ${getErrorMessage(err)}`);
			}

			this.createAndRunTask(item, existingSize);
		} catch (error) {
			this.updateQueueStatus(item.id, DownloadStatus.FAILED, {
				error: getErrorMessage(error),
			});
		}
	}

	private createAndRunTask(item: DownloadItem, initialSize: number): void {
		const task = new DownloaderTask(item, initialSize);
		this.tasks.set(item.id, task);

		task.on("progress", (progressData) => {
			this.updateQueueStatus(item.id, DownloadStatus.DOWNLOADING, progressData);
		});

		task.on("redirect", (redirectedItem: DownloadItem) => {
			// The task stopped, so we clean it up and start a new one with the new URL.
			this.tasks.delete(redirectedItem.id);
			this.createAndRunTask(redirectedItem, initialSize);
		});

		task.on("complete", () => {
			this.updateQueueStatus(item.id, DownloadStatus.COMPLETED, {
				progress: 100,
			});
			this.cleanup(item.id);
		});

		task.on("error", (error: string) => {
			this.handleError(item, error, initialSize);
		});

		task.run();
	}

	private handleError(
		item: DownloadItem,
		error: string,
		initialSize: number,
	): void {
		this.tasks.delete(item.id); // Remove the failed task

		const retryState = this.retryStates.get(item.id) || { retryCount: 0 };
		if (retryState.retryCount < this.MAX_RETRIES) {
			retryState.retryCount++;
			this.retryStates.set(item.id, retryState);
			const delay = 1000 * retryState.retryCount;
			console.log(
				`Download ${item.id} failed: ${error}. Retrying in ${delay}ms...`,
			);
			setTimeout(() => this.createAndRunTask(item, initialSize), delay);
		} else {
			console.error(`Download ${item.id} failed permanently: ${error}`);
			this.updateQueueStatus(item.id, DownloadStatus.FAILED, { error });
			this.cleanup(item.id);
		}
	}

	public pauseDownload(id: string): boolean {
		const task = this.tasks.get(id);
		if (!task) return false;

		task.stop();
		this.updateQueueStatus(id, DownloadStatus.PAUSED);
		this.cleanup(id);
		return true;
	}

	public async resumeDownload(item: DownloadItem): Promise<void> {
		await this.startDownload(item);
	}

	public async cancelDownload(id: string): Promise<boolean> {
		const task = this.tasks.get(id);
		const item = task?.item || downloadQueue.getDownload(id);
		if (!item) return false;

		task?.stop();

		const filePath = path.join(item.path, item.name);
		try {
			await fs.promises.unlink(filePath);
		} catch (err) {
			if (err instanceof Error && "code" in err) {
				if (err.code !== "ENOENT") {
					console.error(`Failed to delete file: ${err.message}`);
				}
			} else {
				console.error(`An unexpected error occurred during deletion: ${err}`);
			}
		}

		this.updateQueueStatus(id, DownloadStatus.CANCELLED, { progress: 0 });
		this.cleanup(id);
		return true;
	}

	private cleanup(id: string): void {
		this.tasks.delete(id);
		this.retryStates.delete(id);
	}

	private updateQueueStatus(
		id: string,
		status: DownloadStatus,
		extra: Partial<DownloadProgress> = {},
	): void {
		const item = downloadQueue.getDownload(id);
		if (!item) return;

		const progressUpdate: DownloadProgress = {
			id,
			status,
			progress: item.progress,
			speed: 0,
			timeRemaining: 0,
			...extra,
		};
		downloadQueue.updateProgress(progressUpdate);
	}
}
