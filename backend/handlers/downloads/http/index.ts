import { DownloadItem, DownloadProgress, DownloadStatus } from "@/@types";
import { EventEmitter } from "events";
import * as fs from "fs";
import * as http from "http";
import * as https from "https";
import * as path from "path";
import { URL } from "url";
import { downloadQueue } from "../queue";

/**
 * Class that handles HTTP downloads
 */
export class HttpDownloadHandler extends EventEmitter {
  private downloads: Map<
    string,
    {
      request?: http.ClientRequest;
      fileStream?: fs.WriteStream;
      startTime: number;
      downloadedBytes: number;
      totalBytes: number;
      lastProgressUpdate: number;
      speedSamples: number[];
      retryCount: number;
    }
  >;

  constructor() {
    super();
    this.downloads = new Map();
  }

  /**
   * Start a HTTP download
   */
  public async startDownload(item: DownloadItem): Promise<void> {
    // Create download tracking object
    this.downloads.set(item.id, {
      startTime: Date.now(),
      downloadedBytes: 0,
      totalBytes: 0,
      lastProgressUpdate: Date.now(),
      speedSamples: [],
      retryCount: 0,
    });

    try {
      // Create directory if it doesn't exist
      const downloadDir = path.dirname(path.join(item.path, item.name));
      await fs.promises.mkdir(downloadDir, { recursive: true });

      // Start the download
      this.initiateDownload(item);
    } catch (error) {
      this.handleError(
        item.id,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Initiate the HTTP download
   */
  private initiateDownload(item: DownloadItem): void {
    const downloadInfo = this.downloads.get(item.id);
    if (!downloadInfo) return;

    // Parse URL
    const parsedUrl = new URL(item.url);
    const protocol = parsedUrl.protocol === "https:" ? https : http;

    // Create request
    const request = protocol.get(item.url, {
      headers: {
        "User-Agent": "Falkor-App/1.0",
      },
    });

    // Store request reference
    downloadInfo.request = request;

    // Handle response
    request.on("response", (response) => {
      // Check for redirect
      if (
        response.statusCode &&
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        // Handle redirect
        request.destroy();
        item.url = new URL(response.headers.location, item.url).toString();
        this.initiateDownload(item);
        return;
      }

      // Check for error status codes
      if (
        response.statusCode &&
        (response.statusCode < 200 || response.statusCode >= 400)
      ) {
        this.handleError(
          item.id,
          `HTTP Error: ${response.statusCode} ${response.statusMessage}`
        );
        return;
      }

      // Get content length
      const contentLength = response.headers["content-length"];
      if (contentLength) {
        downloadInfo.totalBytes = parseInt(contentLength, 10);
        item.size = downloadInfo.totalBytes;
      }

      // Get filename from Content-Disposition if available
      const contentDisposition = response.headers["content-disposition"];
      if (contentDisposition) {
        const filenameMatch = /filename="?([^"]+)"?/i.exec(contentDisposition);
        if (filenameMatch && filenameMatch[1]) {
          item.name = filenameMatch[1];
        }
      }

      // Create file stream
      const filePath = path.join(item.path, item.name);
      const fileStream = fs.createWriteStream(filePath);
      downloadInfo.fileStream = fileStream;

      // Pipe response to file
      response.pipe(fileStream);

      // Handle data chunks
      response.on("data", (chunk) => {
        downloadInfo.downloadedBytes += chunk.length;
        this.updateProgress(item.id);
      });

      // Handle download completion
      fileStream.on("finish", () => {
        fileStream.close();
        this.completeDownload(item.id);
      });

      // Handle errors
      response.on("error", (error) => {
        this.handleError(item.id, error.message);
      });

      fileStream.on("error", (error) => {
        this.handleError(item.id, error.message);
      });
    });

    // Handle request errors
    request.on("error", (error) => {
      this.handleError(item.id, error.message);
    });

    // Set timeout
    request.setTimeout(30000, () => {
      this.handleError(item.id, "Request timed out");
    });
  }

  /**
   * Update download progress
   */
  private updateProgress(id: string): void {
    const item = downloadQueue.getDownload(id);
    const downloadInfo = this.downloads.get(id);
    if (!item || !downloadInfo) return;

    const now = Date.now();
    const timeDiff = now - downloadInfo.lastProgressUpdate;

    // Only update progress every 500ms to avoid excessive updates
    if (timeDiff < 500) return;

    // Calculate progress percentage
    let progress = 0;
    if (downloadInfo.totalBytes > 0) {
      progress = Math.min(
        100,
        (downloadInfo.downloadedBytes / downloadInfo.totalBytes) * 100
      );
    }

    // Calculate download speed (bytes per second)
    const elapsedSeconds = timeDiff / 1000;
    const bytesPerSecond =
      (downloadInfo.downloadedBytes -
        (item.progress / 100) * downloadInfo.totalBytes) /
      elapsedSeconds;

    // Add to speed samples (keep last 5 samples for smoothing)
    downloadInfo.speedSamples.push(bytesPerSecond);
    if (downloadInfo.speedSamples.length > 5) {
      downloadInfo.speedSamples.shift();
    }

    // Calculate average speed
    const avgSpeed =
      downloadInfo.speedSamples.reduce((sum, speed) => sum + speed, 0) /
      downloadInfo.speedSamples.length;

    // Calculate time remaining
    let timeRemaining = 0;
    if (avgSpeed > 0) {
      const bytesRemaining =
        downloadInfo.totalBytes - downloadInfo.downloadedBytes;
      timeRemaining = bytesRemaining / avgSpeed;
    }

    // Update last progress time
    downloadInfo.lastProgressUpdate = now;

    // Create progress update
    const progressUpdate: DownloadProgress = {
      id,
      progress,
      speed: avgSpeed,
      timeRemaining,
      status: DownloadStatus.DOWNLOADING,
    };

    // Update download queue
    downloadQueue.updateProgress(progressUpdate);
  }

  /**
   * Complete a download
   */
  private completeDownload(id: string): void {
    const downloadInfo = this.downloads.get(id);
    if (!downloadInfo) return;

    // Create progress update for completion
    const progressUpdate: DownloadProgress = {
      id,
      progress: 100,
      speed: 0,
      timeRemaining: 0,
      status: DownloadStatus.COMPLETED,
    };

    // Update download queue
    downloadQueue.updateProgress(progressUpdate);

    // Clean up
    this.downloads.delete(id);
  }

  /**
   * Handle download error
   */
  private handleError(id: string, _errorMessage: string): void {
    // Using errorMessage parameter to avoid unused variable warning
    const item = downloadQueue.getDownload(id);
    const downloadInfo = this.downloads.get(id);
    if (!item || !downloadInfo) return;

    // Close file stream if open
    if (downloadInfo.fileStream) {
      downloadInfo.fileStream.close();
    }

    // Abort request if active
    if (downloadInfo.request) {
      downloadInfo.request.destroy();
    }

    // Check if we should retry
    const maxRetries = 3; // This could be configurable
    if (downloadInfo.retryCount < maxRetries) {
      downloadInfo.retryCount++;
      console.log(
        `Retrying download ${id} (attempt ${downloadInfo.retryCount} of ${maxRetries})`
      );

      // Wait before retrying
      setTimeout(() => {
        this.initiateDownload(item);
      }, 1000 * downloadInfo.retryCount); // Exponential backoff

      return;
    }

    // Create progress update for failure
    const progressUpdate: DownloadProgress = {
      id,
      progress: item.progress,
      speed: 0,
      timeRemaining: 0,
      status: DownloadStatus.FAILED,
    };

    // Update download queue with error
    downloadQueue.updateProgress(progressUpdate);

    // Clean up
    this.downloads.delete(id);
  }

  /**
   * Pause a download
   */
  public pauseDownload(id: string): boolean {
    const downloadInfo = this.downloads.get(id);
    if (!downloadInfo) return false;

    // Abort request if active
    if (downloadInfo.request) {
      downloadInfo.request.destroy();
    }

    // Close file stream if open
    if (downloadInfo.fileStream) {
      downloadInfo.fileStream.close();
    }

    // Clean up
    this.downloads.delete(id);

    return true;
  }

  /**
   * Resume a download
   * Note: HTTP resume requires range support from the server
   * This is a simplified implementation
   */
  public resumeDownload(item: DownloadItem): void {
    // For simplicity, we'll just restart the download
    // A full implementation would use Range headers to resume
    this.startDownload(item);
  }

  /**
   * Cancel a download
   */
  public cancelDownload(id: string): boolean {
    return this.pauseDownload(id);
  }
}

// Create and export singleton instance
export const httpDownloadHandler = new HttpDownloadHandler();
