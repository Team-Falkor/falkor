import { EventEmitter } from "node:events";
import * as fs from "node:fs";
import * as http from "node:http";
import * as https from "node:https";
import * as path from "node:path";
import { URL } from "node:url";
import type { DownloadItem } from "@/@types";

/**
 * Manages the execution of a single HTTP/S download task.
 * It handles the request, file writing, and progress calculation,
 * emitting events for the handler to consume.
 */
export class DownloaderTask extends EventEmitter {
	private request?: http.ClientRequest;
	private fileStream?: fs.WriteStream;

	private downloadedBytes: number;
	private totalBytes: number;
	private lastDownloadedBytes: number;
	private lastProgressUpdate = 0;
	private speedSamples: number[] = [];

	constructor(
		public item: DownloadItem,
		private initialDownloadedBytes: number,
	) {
		super();
		this.downloadedBytes = initialDownloadedBytes;
		this.lastDownloadedBytes = initialDownloadedBytes;
		this.totalBytes = item.size || 0;
	}

	/**
	 * Starts the download process.
	 */
	public run(): void {
		const parsedUrl = new URL(this.item.url);
		const protocol = parsedUrl.protocol === "https:" ? https : http;
		const headers: Record<string, string> = {};

		if (this.initialDownloadedBytes > 0) {
			headers.Range = `bytes=${this.initialDownloadedBytes}-`;
		}

		this.request = protocol.get(this.item.url, { headers });
		this.setupListeners();
	}

	/**
	 * Aborts the download. Used for pausing and canceling.
	 */
	public stop(): void {
		this.request?.destroy();
		this.fileStream?.close();
	}

	private setupListeners(): void {
		const req = this.request;

		if (!req) {
			this.emit("error", "Request not initialized");
			return;
		}

		req.on("response", this.handleResponse.bind(this));
		req.on("error", (err) => this.emit("error", err.message));
		req.setTimeout(30000, () => {
			req.destroy();
			this.emit("error", "Request timed out after 30 seconds");
		});
	}

	private handleResponse(response: http.IncomingMessage): void {
		// Handle redirects
		if (
			response.statusCode &&
			response.statusCode >= 300 &&
			response.statusCode < 400 &&
			response.headers.location
		) {
			this.item.url = new URL(
				response.headers.location,
				this.item.url,
			).toString();
			this.emit("redirect", this.item);
			return;
		}

		// Handle errors
		if (
			response.statusCode &&
			response.statusCode !== 200 &&
			response.statusCode !== 206
		) {
			this.emit(
				"error",
				`HTTP Error: ${response.statusCode} ${response.statusMessage}`,
			);
			return;
		}

		this.determineFileInfo(response);
		this.setupFileStream(response);
	}

	private determineFileInfo(response: http.IncomingMessage): void {
		const isResuming = response.statusCode === 206;

		// Get total file size
		if (isResuming) {
			const contentRange = response.headers["content-range"];
			const totalMatch = contentRange ? /\/(\d+)/.exec(contentRange) : null;
			if (totalMatch?.[1]) {
				this.totalBytes = Number.parseInt(totalMatch[1], 10);
			}
		} else {
			const contentLength = response.headers["content-length"];
			if (contentLength) {
				this.totalBytes = Number.parseInt(contentLength, 10);
			}
		}
		this.item.size = this.totalBytes;
	}

	private setupFileStream(response: http.IncomingMessage): void {
		const filePath = path.join(this.item.path, this.item.name);
		this.fileStream = fs.createWriteStream(filePath, {
			flags: response.statusCode === 206 ? "a" : "w",
		});

		response.pipe(this.fileStream);

		response.on("data", (chunk) => {
			this.downloadedBytes += chunk.length;
			this.calculateProgress();
		});

		this.fileStream.on("finish", () => {
			this.fileStream?.close();
			this.emit("complete");
		});

		response.on("error", (err) => this.emit("error", err.message));
		this.fileStream.on("error", (err) => this.emit("error", err.message));
	}

	private calculateProgress(): void {
		const now = Date.now();
		if (now - this.lastProgressUpdate < 500) return;

		const timeDiff = (now - this.lastProgressUpdate) / 1000;
		const bytesDiff = this.downloadedBytes - this.lastDownloadedBytes;
		const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0;

		this.speedSamples.push(speed);
		if (this.speedSamples.length > 5) this.speedSamples.shift();
		const avgSpeed =
			this.speedSamples.reduce((sum, s) => sum + s, 0) /
			this.speedSamples.length;

		const progress =
			this.totalBytes > 0 ? (this.downloadedBytes / this.totalBytes) * 100 : 0;
		const bytesRemaining = this.totalBytes - this.downloadedBytes;
		const timeRemaining =
			avgSpeed > 0 ? bytesRemaining / avgSpeed : Number.POSITIVE_INFINITY;

		this.lastProgressUpdate = now;
		this.lastDownloadedBytes = this.downloadedBytes;

		this.emit("progress", { progress, speed: avgSpeed, timeRemaining });
	}
}
