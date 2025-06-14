import { EventEmitter } from "node:events";
import * as fs from "node:fs";
import * as http from "node:http";
import * as https from "node:https";
import * as path from "node:path";
import { URL } from "node:url";
import { getErrorMessage } from "@backend/utils/utils";
import { type DownloadItem, DownloadStatus } from "@/@types";
import { downloadQueue } from "../queue";

/**
 * Represents the internal state of an active download.
 */
interface DownloadState {
	/** The active HTTP client request. */
	request?: http.ClientRequest;
	/** The file stream for writing the download to disk. */
	fileStream?: fs.WriteStream;
	/** Timestamp when the download was initiated. */
	readonly startTime: number;
	/** The total number of bytes downloaded to disk. */
	downloadedBytes: number;
	/** The number of bytes downloaded at the last progress update. */
	lastUpdateBytes: number;
	/** The total size of the file in bytes. */
	totalBytes: number;
	/** Timestamp of the last progress update. */
	lastProgressUpdate: number;
	/** A list of recent speed samples for calculating a smoothed average speed. */
	speedSamples: number[];
	/** The number of times a download has been retried after an error. */
	retryCount: number;
	/**
	 * Flag to prevent a race condition where a stream `finish` event fires
	 * after an `error` event, incorrectly marking a failed download as complete.
	 */
	hasError: boolean;
}

/**
 * Handles the process of downloading files over HTTP and HTTPS.
 *
 * This class manages the entire download lifecycle, including starting, pausing,
 * resuming, and cancelling downloads. It handles network errors with a configurable
 * retry mechanism and provides progress updates.
 */
export class HttpDownloadHandler extends EventEmitter {
	private static readonly MAX_RETRIES = 3;
	private static readonly RETRY_DELAY_MS = 1000;
	private static readonly PROGRESS_UPDATE_INTERVAL_MS = 500;
	private static readonly MAX_SPEED_SAMPLES = 10;
	private static readonly REQUEST_TIMEOUT_MS = 30000;

	private readonly downloads: Map<string, DownloadState>;

	constructor() {
		super();
		this.downloads = new Map();
	}

	/**
	 * Starts or resumes a download for a given item.
	 * If a partial file exists, it will attempt to resume the download.
	 * @param item The download item to start.
	 */
	public async startDownload(item: DownloadItem): Promise<void> {
		if (this.downloads.has(item.id)) {
			console.warn(`Download for item ${item.id} is already in progress.`);
			return;
		}

		this.downloads.set(item.id, {
			startTime: Date.now(),
			downloadedBytes: 0,
			lastUpdateBytes: 0,
			totalBytes: 0,
			lastProgressUpdate: 0,
			speedSamples: [],
			retryCount: 0,
			hasError: false,
		});

		try {
			const downloadDir = path.dirname(path.join(item.path, item.name));
			await fs.promises.mkdir(downloadDir, { recursive: true, mode: 0o755 });
			this.initiateDownload(item);
		} catch (error) {
			this.handleError(
				item.id,
				`Failed to create directory: ${getErrorMessage(error)}`,
			);
		}
	}

	/**
	 * Initiates the HTTP request for the download.
	 * @param item The download item.
	 */
	private async initiateDownload(item: DownloadItem): Promise<void> {
		const downloadInfo = this.downloads.get(item.id);
		if (!downloadInfo) return;

		// Ensure the error flag is reset for new attempts (including retries).
		downloadInfo.hasError = false;

		const filePath = path.join(item.path, item.name);
		const requestOptions: http.RequestOptions = {};
		let existingSize = 0;

		try {
			const stats = await fs.promises.stat(filePath);
			existingSize = stats.size;
			if (existingSize > 0) {
				requestOptions.headers = { Range: `bytes=${existingSize}-` };
			}
		} catch (error) {
			if (
				typeof error === "object" &&
				error !== null &&
				"code" in error &&
				(error as { code: unknown }).code !== "ENOENT"
			) {
				this.handleError(
					item.id,
					`File system error: ${getErrorMessage(error)}`,
				);
				return;
			}
		}

		const protocol = item.url.startsWith("https:") ? https : http;
		const request = protocol.get(item.url, requestOptions);
		downloadInfo.request = request;

		request.on("response", (response) => {
			if (
				response.statusCode &&
				response.statusCode >= 300 &&
				response.statusCode < 400 &&
				response.headers.location
			) {
				request.destroy();
				item.url = new URL(response.headers.location, item.url).toString();
				this.initiateDownload(item);
				return;
			}

			if (
				response.statusCode &&
				(response.statusCode < 200 || response.statusCode >= 300)
			) {
				this.handleError(
					item.id,
					`HTTP Error: ${response.statusCode} ${response.statusMessage}`,
				);
				return;
			}

			item.name = this.determineFilename(item, response);
			const finalPath = path.join(item.path, item.name);

			const isResuming = response.statusCode === 206;
			if (isResuming) {
				const contentRange = response.headers["content-range"];
				const match =
					contentRange && /bytes (\d+)-\d+\/(\d+)/.exec(contentRange);
				if (match) {
					downloadInfo.downloadedBytes = Number.parseInt(match[1], 10);
					downloadInfo.totalBytes = Number.parseInt(match[2], 10);
				}
			} else {
				const contentLength = response.headers["content-length"];
				downloadInfo.downloadedBytes = 0;
				downloadInfo.totalBytes = contentLength
					? Number.parseInt(contentLength, 10)
					: 0;
			}
			item.size = downloadInfo.totalBytes;
			downloadInfo.lastUpdateBytes = downloadInfo.downloadedBytes;

			const fileStream = fs.createWriteStream(finalPath, {
				flags: isResuming ? "a" : "w",
			});
			downloadInfo.fileStream = fileStream;

			response.pipe(fileStream);

			response.on("data", (chunk) => {
				downloadInfo.downloadedBytes += chunk.length;
				this.updateProgress(item.id);
			});

			fileStream.on("finish", () => {
				// If an error has occurred, the handleError method is in control.
				// We must not mark the download as complete, as it could be
				// in the middle of a retry cycle.
				if (downloadInfo.hasError) {
					return;
				}
				fileStream.close(() => this.completeDownload(item.id));
			});

			fileStream.on("error", (error) =>
				this.handleError(item.id, error.message),
			);
			response.on("error", (error) => this.handleError(item.id, error.message));
		});

		request.on("error", (error) => this.handleError(item.id, error.message));

		request.setTimeout(HttpDownloadHandler.REQUEST_TIMEOUT_MS, () => {
			this.handleError(item.id, "Request timed out");
		});
	}

	/**
	 * Pauses an active download.
	 * The partially downloaded file is kept for future resumption.
	 * @param id The ID of the download to pause.
	 * @returns True if the download was found and paused, otherwise false.
	 */
	public pauseDownload(id: string): boolean {
		const downloadInfo = this.downloads.get(id);
		if (!downloadInfo) return false;

		downloadInfo.request?.destroy();
		downloadInfo.fileStream?.close();

		const item = downloadQueue.getDownload(id);
		if (item) {
			downloadQueue.updateProgress({
				id,
				progress: item.progress,
				speed: 0,
				timeRemaining: 0,
				status: DownloadStatus.PAUSED,
			});
		}

		this.downloads.delete(id);
		return true;
	}

	/**
	 * Resumes a paused download.
	 * @param item The download item to resume.
	 */
	public async resumeDownload(item: DownloadItem): Promise<void> {
		await this.startDownload(item);
	}

	/**
	 * Cancels a download and deletes the partially downloaded file.
	 * @param id The ID of the download to cancel.
	 * @returns True if the download was found and cancelled, otherwise false.
	 */
	public async cancelDownload(id: string): Promise<boolean> {
		const item = downloadQueue.getDownload(id);
		const downloadInfo = this.downloads.get(id);
		if (!item && !downloadInfo) return false;

		downloadInfo?.request?.destroy();
		downloadInfo?.fileStream?.close();

		this.downloads.delete(id);

		if (item) {
			try {
				const filePath = path.join(item.path, item.name);
				await fs.promises.unlink(filePath);
			} catch (error) {
				if (
					typeof error === "object" &&
					error !== null &&
					"code" in error &&
					(error as { code: unknown }).code !== "ENOENT"
				) {
					console.error(
						`Failed to delete cancelled file: ${getErrorMessage(error)}`,
					);
				}
			}
		}

		downloadQueue.updateProgress({
			id,
			progress: 0,
			speed: 0,
			timeRemaining: 0,
			status: DownloadStatus.CANCELLED,
		});

		return true;
	}

	/**
	 * Determines the final filename based on headers and URL.
	 * Priority: Content-Disposition > URL Path > Content-Type.
	 * @param item The download item.
	 * @param response The incoming HTTP response.
	 * @returns The determined filename.
	 */
	private determineFilename(
		item: DownloadItem,
		response: http.IncomingMessage,
	): string {
		const contentDisposition = response.headers["content-disposition"];
		if (contentDisposition) {
			const match = /filename="?([^"]+)"?/i.exec(contentDisposition);
			if (match?.[1]) {
				return path.basename(match[1]); // Sanitize to prevent path traversal
			}
		}

		const urlFilename = path.basename(new URL(item.url).pathname);
		if (path.extname(urlFilename)) {
			return urlFilename;
		}

		let filename = item.name || urlFilename || "download";
		if (!path.extname(filename)) {
			const contentType = response.headers["content-type"];
			const ext = contentType?.split("/").pop()?.split(";")[0].trim();
			if (ext && ext.length > 1 && ext.length < 5 && ext !== "octet-stream") {
				filename = `${filename}.${ext}`;
			}
		}
		return filename;
	}

	/**
	 * Calculates and broadcasts download progress.
	 * @param id The ID of the download.
	 */
	private updateProgress(id: string): void {
		const downloadInfo = this.downloads.get(id);
		if (!downloadInfo) return;

		const now = Date.now();
		const timeDiff =
			now - (downloadInfo.lastProgressUpdate || downloadInfo.startTime);

		if (timeDiff < HttpDownloadHandler.PROGRESS_UPDATE_INTERVAL_MS) return;

		const progress =
			downloadInfo.totalBytes > 0
				? Math.min(
						100,
						(downloadInfo.downloadedBytes / downloadInfo.totalBytes) * 100,
					)
				: 0;

		const bytesSinceLastUpdate =
			downloadInfo.downloadedBytes - downloadInfo.lastUpdateBytes;
		const speed = (bytesSinceLastUpdate / timeDiff) * 1000;

		downloadInfo.speedSamples.push(speed);
		if (
			downloadInfo.speedSamples.length > HttpDownloadHandler.MAX_SPEED_SAMPLES
		) {
			downloadInfo.speedSamples.shift();
		}
		const avgSpeed =
			downloadInfo.speedSamples.reduce((sum, s) => sum + s, 0) /
			downloadInfo.speedSamples.length;

		const bytesRemaining =
			downloadInfo.totalBytes - downloadInfo.downloadedBytes;
		const timeRemaining = avgSpeed > 0 ? bytesRemaining / avgSpeed : 0;

		downloadInfo.lastProgressUpdate = now;
		downloadInfo.lastUpdateBytes = downloadInfo.downloadedBytes;

		downloadQueue.updateProgress({
			id,
			progress,
			speed: avgSpeed,
			timeRemaining,
			status: DownloadStatus.DOWNLOADING,
		});
	}

	/**
	 * Finalizes a completed download.
	 * @param id The ID of the completed download.
	 */
	private completeDownload(id: string): void {
		if (!this.downloads.has(id)) return;
		downloadQueue.updateProgress({
			id,
			progress: 100,
			speed: 0,
			timeRemaining: 0,
			status: DownloadStatus.COMPLETED,
		});
		this.downloads.delete(id);
	}

	/**
	 * Handles errors during the download process, with retry logic.
	 * @param id The ID of the download that failed.
	 * @param errorMessage A message describing the error.
	 */
	private handleError(id: string, errorMessage: string): void {
		const item = downloadQueue.getDownload(id);
		const downloadInfo = this.downloads.get(id);
		if (!item || !downloadInfo) return;

		// Set the error flag *before* closing the stream. This prevents the
		// 'finish' event from incorrectly marking the download as complete.
		downloadInfo.hasError = true;

		downloadInfo.request?.destroy();
		downloadInfo.fileStream?.close();

		if (downloadInfo.retryCount < HttpDownloadHandler.MAX_RETRIES) {
			downloadInfo.retryCount++;
			const delay =
				downloadInfo.retryCount * HttpDownloadHandler.RETRY_DELAY_MS;
			console.log(
				`Download error for ${id}: ${errorMessage}. Retrying in ${delay}ms...`,
			);
			setTimeout(() => this.initiateDownload(item), delay);
		} else {
			console.error(`Download for ${id} failed permanently: ${errorMessage}`);
			downloadQueue.updateProgress({
				id,
				progress: item.progress,
				speed: 0,
				timeRemaining: 0,
				status: DownloadStatus.FAILED,
			});
			this.downloads.delete(id);
		}
	}
}

export const httpDownloadHandler = new HttpDownloadHandler();
