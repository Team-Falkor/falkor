import { EventEmitter } from "node:events";
import * as fs from "node:fs";
import * as http from "node:http";
import * as https from "node:https";
import * as path from "node:path";
import { URL } from "node:url";
import { getErrorMessage } from "@backend/utils/utils";
import {
	type DownloadItem,
	type DownloadProgress,
	DownloadStatus,
} from "@/@types";
import { downloadQueue } from "../queue";

/**
 * Defines the state we need to track for each individual download.
 */
interface DownloadState {
	request?: http.ClientRequest;
	fileStream?: fs.WriteStream;
	startTime: number;
	downloadedBytes: number;
	totalBytes: number;
	// We'll track the last byte count to calculate speed more accurately.
	lastDownloadedBytes: number;
	lastProgressUpdate: number;
	speedSamples: number[];
	retryCount: number;
}

/**
 * Class that handles the entire lifecycle of an HTTP/HTTPS download,
 * including starting, pausing, resuming, and canceling.
 */
export class HttpDownloadHandler extends EventEmitter {
	private downloads: Map<string, DownloadState>;

	constructor() {
		super();
		this.downloads = new Map();
	}

	/**
	 * Kicks off a new download or resumes a previously paused one.
	 * @param item - The download item containing URL, path, and other details.
	 */
	public async startDownload(item: DownloadItem): Promise<void> {
		// If we're already handling this download, don't start another one.
		if (this.downloads.has(item.id)) {
			console.warn(`Download ${item.id} is already in progress.`);
			return;
		}

		// Create a new state object to track this download's progress.
		this.downloads.set(item.id, {
			startTime: Date.now(),
			downloadedBytes: 0,
			lastDownloadedBytes: 0,
			totalBytes: item.size || 0,
			lastProgressUpdate: 0,
			speedSamples: [],
			retryCount: 0,
		});

		try {
			// First, make sure the directory where we want to save the file actually exists.
			await fs.promises.mkdir(item.path, { recursive: true, mode: 0o755 });

			// Now, let's start the real download process.
			this.initiateDownload(item);
		} catch (error) {
			this.handleError(item.id, getErrorMessage(error));
		}
	}

	/**
	 * The core method that makes the HTTP request and handles the response.
	 * @param item - The download item to process.
	 */
	private async initiateDownload(item: DownloadItem): Promise<void> {
		const downloadInfo = this.downloads.get(item.id);
		if (!downloadInfo) return;

		const parsedUrl = new URL(item.url);
		const protocol = parsedUrl.protocol === "https:" ? https : http;
		const filePath = path.join(item.path, item.name);

		const headers: Record<string, string> = {};
		let existingSize = 0;

		// Let's see if a part of the file already exists.
		try {
			const stats = await fs.promises.stat(filePath);
			existingSize = stats.size;
			if (existingSize > 0) {
				// If it does, we'll tell the server to send us the rest of the file.
				headers.Range = `bytes=${existingSize}-`;
				downloadInfo.downloadedBytes = existingSize;
				downloadInfo.lastDownloadedBytes = existingSize;
			}
		} catch {
			// No file exists, so we'll start from scratch.
		}

		const request = protocol.get(item.url, { headers });
		downloadInfo.request = request;

		request.on("response", (response) => {
			// Handle server redirects (e.g., 301, 302).
			if (
				response.statusCode &&
				response.statusCode >= 300 &&
				response.statusCode < 400 &&
				response.headers.location
			) {
				request.destroy();
				item.url = new URL(response.headers.location, item.url).toString();
				this.initiateDownload(item); // Try again with the new URL.
				return;
			}

			// Handle server or client errors.
			if (
				response.statusCode &&
				(response.statusCode < 200 || response.statusCode >= 300) &&
				response.statusCode !== 206 // 206 Partial Content is a success for resumes.
			) {
				this.handleError(
					item.id,
					`HTTP Error: ${response.statusCode} ${response.statusMessage}`,
				);
				return;
			}

			const isResuming = response.statusCode === 206;

			// --- Filename and Size Determination ---

			// The server's response headers can give us the real filename and size.
			const contentDisposition = response.headers["content-disposition"];
			if (contentDisposition) {
				const filenameMatch = /filename="?([^"]+)"?/i.exec(contentDisposition);
				if (filenameMatch?.[1]) {
					item.name = filenameMatch[1];
				}
			}

			// If we still don't have a proper filename, try to get one from the URL.
			if (!item.name || !path.extname(item.name)) {
				const urlPath = new URL(item.url).pathname;
				const urlFilename = path.basename(urlPath);
				if (urlFilename && path.extname(urlFilename)) {
					item.name = urlFilename;
				}
			}

			// --- Total Size Calculation (Crucial Fix) ---
			if (isResuming) {
				// For resumes, Content-Length is the *remaining* size.
				// We must parse Content-Range to get the *total* size.
				// e.g., "bytes 1000-2000/5000" -> 5000 is the total.
				const contentRange = response.headers["content-range"];
				const totalMatch = contentRange ? /\/(\d+)/.exec(contentRange) : null;
				if (totalMatch?.[1]) {
					downloadInfo.totalBytes = Number.parseInt(totalMatch[1], 10);
				}
			} else {
				// For new downloads, Content-Length is the total size.
				const contentLength = response.headers["content-length"];
				if (contentLength) {
					downloadInfo.totalBytes = Number.parseInt(contentLength, 10);
				}
			}
			item.size = downloadInfo.totalBytes;

			// Now that we have the final filename, create the write stream.
			const finalFilePath = path.join(item.path, item.name);
			const fileStream = fs.createWriteStream(finalFilePath, {
				flags: isResuming ? "a" : "w", // 'a' to append, 'w' to write new.
			});
			downloadInfo.fileStream = fileStream;

			response.pipe(fileStream);

			response.on("data", (chunk) => {
				downloadInfo.downloadedBytes += chunk.length;
				this.updateProgress(item.id);
			});

			fileStream.on("finish", () => {
				fileStream.close();
				this.completeDownload(item.id);
			});

			response.on("error", (error) => this.handleError(item.id, error.message));
			fileStream.on("error", (error) =>
				this.handleError(item.id, error.message),
			);
		});

		request.on("error", (error) => this.handleError(item.id, error.message));

		request.setTimeout(30000, () => {
			request.destroy();
			this.handleError(item.id, "Request timed out after 30 seconds");
		});
	}

	/**
	 * Calculates and broadcasts download progress.
	 * @param id - The ID of the download to update.
	 */
	private updateProgress(id: string): void {
		const item = downloadQueue.getDownload(id);
		const downloadInfo = this.downloads.get(id);
		if (!item || !downloadInfo) return;

		const now = Date.now();
		// We throttle updates to avoid overwhelming the system.
		if (now - downloadInfo.lastProgressUpdate < 500) {
			return;
		}

		const timeDiff = (now - downloadInfo.lastProgressUpdate) / 1000; // in seconds
		const bytesDiff =
			downloadInfo.downloadedBytes - downloadInfo.lastDownloadedBytes;
		const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0; // Bytes per second

		// Use a moving average for a smoother speed display.
		downloadInfo.speedSamples.push(speed);
		if (downloadInfo.speedSamples.length > 5) {
			downloadInfo.speedSamples.shift();
		}
		const avgSpeed =
			downloadInfo.speedSamples.reduce((sum, s) => sum + s, 0) /
			downloadInfo.speedSamples.length;

		const progress =
			downloadInfo.totalBytes > 0
				? (downloadInfo.downloadedBytes / downloadInfo.totalBytes) * 100
				: 0;

		const bytesRemaining =
			downloadInfo.totalBytes - downloadInfo.downloadedBytes;
		const timeRemaining = avgSpeed > 0 ? bytesRemaining / avgSpeed : Infinity;

		downloadInfo.lastProgressUpdate = now;
		downloadInfo.lastDownloadedBytes = downloadInfo.downloadedBytes;

		const progressUpdate: DownloadProgress = {
			id,
			progress,
			speed: avgSpeed,
			timeRemaining,
			status: DownloadStatus.DOWNLOADING,
		};

		downloadQueue.updateProgress(progressUpdate);
	}

	/**
	 * Finalizes a successful download.
	 * @param id - The ID of the completed download.
	 */
	private completeDownload(id: string): void {
		if (!this.downloads.has(id)) return;

		const progressUpdate: DownloadProgress = {
			id,
			progress: 100,
			speed: 0,
			timeRemaining: 0,
			status: DownloadStatus.COMPLETED,
		};
		downloadQueue.updateProgress(progressUpdate);

		// Clean up the tracking state.
		this.downloads.delete(id);
	}

	/**
	 * Handles any error during the download, with a retry mechanism.
	 * @param id - The ID of the failed download.
	 * @param errorMessage - The error message to report.
	 */
	private handleError(id: string, errorMessage: string): void {
		const item = downloadQueue.getDownload(id);
		const downloadInfo = this.downloads.get(id);
		if (!item || !downloadInfo) return;

		// Clean up existing connections.
		downloadInfo.request?.destroy();
		downloadInfo.fileStream?.close();

		const maxRetries = 3;
		if (downloadInfo.retryCount < maxRetries) {
			downloadInfo.retryCount++;
			const delay = 1000 * downloadInfo.retryCount; // Exponential backoff
			console.log(
				`Download ${id} failed. Retrying in ${delay}ms... (Attempt ${downloadInfo.retryCount}/${maxRetries})`,
			);
			setTimeout(() => this.initiateDownload(item), delay);
			return;
		}

		// If we've exhausted retries, mark the download as failed.
		console.error(`Download ${id} failed permanently: ${errorMessage}`);
		const progressUpdate: DownloadProgress = {
			id,
			progress: item.progress,
			speed: 0,
			timeRemaining: 0,
			status: DownloadStatus.FAILED,
			// Pass the actual error message for better diagnostics.
			// Note: This assumes the DownloadProgress type can hold an error.
			error: errorMessage,
		};
		downloadQueue.updateProgress(progressUpdate);

		// Clean up the tracking state.
		this.downloads.delete(id);
	}

	/**
	 * Pauses an active download without deleting the file.
	 * @param id - The ID of the download to pause.
	 * @returns True if the download was found and paused, otherwise false.
	 */
	public pauseDownload(id: string): boolean {
		const downloadInfo = this.downloads.get(id);
		if (!downloadInfo) return false;

		// Stop the network request and file writing.
		downloadInfo.request?.destroy();
		downloadInfo.fileStream?.close();

		// Update the status in the main queue.
		const item = downloadQueue.getDownload(id);
		if (item) {
			const progressUpdate: DownloadProgress = {
				id,
				progress: item.progress,
				speed: 0,
				timeRemaining: 0,
				status: DownloadStatus.PAUSED,
			};
			downloadQueue.updateProgress(progressUpdate);
		}

		// Important: We keep the partial file on disk for resuming.
		// We only remove the *active* download state.
		this.downloads.delete(id);
		return true;
	}

	/**
	 * Resumes a paused download.
	 * This is an alias for startDownload, which already contains resume logic.
	 * @param item - The download item to resume.
	 */
	public async resumeDownload(item: DownloadItem): Promise<void> {
		await this.startDownload(item);
	}

	/**
	 * Cancels a download and deletes the partially downloaded file.
	 * @param id - The ID of the download to cancel.
	 * @returns True if the download was found and canceled, otherwise false.
	 */
	public async cancelDownload(id: string): Promise<boolean> {
		const downloadInfo = this.downloads.get(id);
		const item = downloadQueue.getDownload(id);

		if (!item) return false;

		// If the download is actively running, stop it first.
		if (downloadInfo) {
			downloadInfo.request?.destroy();
			downloadInfo.fileStream?.close();
			this.downloads.delete(id);
		}

		// This is the key difference from pause: we delete the file.
		const filePath = path.join(item.path, item.name);
		try {
			await fs.promises.unlink(filePath);
			console.log(`Canceled download ${id} and deleted partial file.`);
		} catch (error: any) {
			// It's okay if the file doesn't exist, but log other errors.
			if (error.code !== "ENOENT") {
				console.error(
					`Error deleting file for canceled download ${id}:`,
					error,
				);
			}
		}

		// Update the queue to reflect the cancellation.
		const progressUpdate: DownloadProgress = {
			id,
			progress: 0,
			speed: 0,
			timeRemaining: 0,
			status: DownloadStatus.CANCELLED,
		};
		downloadQueue.updateProgress(progressUpdate);

		return true;
	}
}

// Create and export singleton instance
export const httpDownloadHandler = new HttpDownloadHandler();
