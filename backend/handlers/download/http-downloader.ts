import fs from "fs";
import https from "https";
import { sanitizeFilename } from "../../utils";
import window from "../../utils/window";
import download_events from "./events";
import { DownloadItem as item } from "./item";

/**
 * HttpDownloader
 * A class responsible for handling HTTP-based file downloads with support
 * for pause, resume, progress tracking, error handling, and speed calculation.
 */
class HttpDownloader {
  item: item; // Represents the download item.
  private request?: ReturnType<typeof https.get>; // Holds the current HTTPS request.
  private isPaused: boolean = false; // Tracks whether the download is paused.
  private downloadedSize: number = 0; // Tracks the total bytes downloaded.
  private speedInterval?: NodeJS.Timeout; // Interval for tracking download speed.
  private progressInterval?: NodeJS.Timeout; // Interval for tracking download progress.
  private previousDownloadedSize: number = 0; // Tracks the previously downloaded size for speed calculation.
  private previousProgress: number = 0; // Tracks previous progress percentage.
  private fileStream?: fs.WriteStream; // Writable stream for saving the file.
  private progressCallback?: (progress: {
    percent: number;
    speed: number;
    eta: number;
    total: number;
  }) => void; // Callback for progress updates

  constructor(item: item) {
    this.item = item; // Initialize the download item.
  }

  /**
   * Sets a callback function to be called when download progress updates
   * @param callback Function to call with progress information
   */
  public setProgressCallback(
    callback: (progress: {
      percent: number;
      speed: number;
      eta: number;
      total: number;
    }) => void
  ): void {
    this.progressCallback = callback;
  }

  /**
   * Starts or resumes the download process.
   * Manages HTTP requests, file streaming, progress, and error handling.
   */
  public async download(): Promise<void> {
    if (this.item.status === "completed") return; // Skip if already completed.

    console.log(`[Download]: ${this.item.id} Starting download...`);
    this.item.updateStatus("downloading");
    this.previousDownloadedSize = this.downloadedSize;

    return new Promise<void>((resolve, reject) => {
      // Define HTTP request options, including byte range for resuming.
      const options = {
        headers:
          this.downloadedSize > 0
            ? { Range: `bytes=${this.downloadedSize}-` }
            : undefined,
      };

      const timeoutDuration = 30000; // Timeout duration in milliseconds (30 seconds).

      // Create an HTTPS GET request to fetch the file.
      this.request = https.get(this.item.url, options, (response) => {
        // Validate HTTP response status for partial (206) or full (200) content.
        if (![200, 206].includes(response.statusCode!)) {
          this.handleError(
            reject,
            `Failed to download: ${response.statusMessage}`
          );
          return;
        }

        // Get content length for calculating total size.
        const contentLengthHeader = response.headers["content-length"];
        if (!contentLengthHeader) {
          this.handleError(reject, "Missing content-length header.");
          return;
        }

        const contentLength = Number(contentLengthHeader);
        if (isNaN(contentLength) || contentLength <= 0) {
          this.handleError(reject, "Invalid content-length value.");
          return;
        }

        // Check if the response is partial content (resuming download).
        const isPartialContent = response.statusCode === 206;
        const totalSize =
          contentLength + (isPartialContent ? this.downloadedSize : 0);
        this.item.totalSize = totalSize;

        console.log(
          `[Download]: Total size: ${totalSize}, Downloaded: ${this.downloadedSize}`
        );

        // Generate a sanitized file path for saving the file.
        const sanitizedPath = this.getSanitizedFilePath();
        this.fileStream = fs.createWriteStream(sanitizedPath, {
          flags: isPartialContent ? "a" : "w", // Append or write based on partial content.
        });

        // Pipe the response stream to the file stream.
        response.pipe(this.fileStream);

        // Start tracking download speed and progress.
        this.startSpeedTracking(totalSize);
        this.startProgressTracking(totalSize);

        // Set a timeout to handle stalled requests.
        this.request!.setTimeout(timeoutDuration, () => {
          this.handleError(reject, "Download timed out.");
        });

        // Track the data being downloaded.
        response.on("data", (chunk) => {
          this.downloadedSize += chunk.length;
        });

        // Handle successful download completion.
        response.on("end", () => {
          this.cleanupStreams();
          console.log(`[Download]: Download complete`);
          this.finishDownload(resolve);
        });

        // Handle file stream errors.
        this.fileStream.on("error", (error) => {
          console.error(`[Download]: Error writing file: ${error.message}`);
          this.handleError(reject, error.message);
        });

        // Handle request errors.
        this.request!.on("error", (error) => {
          console.error(`[Download]: Error downloading file: ${error.message}`);
          this.handleError(reject, error.message);
        });

        // Handle response stream errors.
        response.on("error", (error) => {
          console.error(`[Download]: Response error: ${error.message}`);
          this.handleError(reject, error.message);
        });
      });

      // Catch unexpected errors in the request itself.
      this.request.on("error", (error) => {
        console.error(`[Download]: Unexpected error: ${error.message}`);
        this.handleError(reject, error.message);
      });
    });
  }

  /**
   * Returns a sanitized file path for saving the downloaded file.
   */
  private getSanitizedFilePath(): string {
    const sanitizedFilename = sanitizeFilename(this.item.filename);
    return `${this.item.filePath}/${sanitizedFilename}.${this.item.fileExtension}`;
  }

  /**
   * Starts an interval to track download speed.
   */
  private startSpeedTracking(totalSize: number) {
    this.previousDownloadedSize = this.downloadedSize;

    this.speedInterval = setInterval(() => {
      const bytesDownloaded = this.downloadedSize - this.previousDownloadedSize;
      this.item.updateDownloadSpeed(bytesDownloaded);

      const remainingBytes = totalSize - this.downloadedSize;
      const timeRemainingMs =
        bytesDownloaded > 0
          ? (remainingBytes / bytesDownloaded) * 1000
          : Infinity;
      this.item.updateTimeRemaining(timeRemainingMs);

      this.previousDownloadedSize = this.downloadedSize;
    }, 1000); // Update every 1 second.
  }

  /**
   * Starts an interval to track download progress.
   */
  private startProgressTracking(totalSize: number) {
    this.progressInterval = setInterval(() => {
      let progress = (this.downloadedSize / totalSize) * 100;
      progress = Math.min(Math.max(progress, 0), 100);

      if (Math.abs(progress - this.previousProgress) >= 0.002) {
        this.previousProgress = progress;
        const roundedProgress = Math.round(progress * 100) / 100;

        console.log(
          `[Progress]: ${this.item.id} - ${roundedProgress}% (${this.downloadedSize}/${totalSize})`
        );

        this.item.updateProgress(roundedProgress);
        this.item.sendProgress();
      }
    }, 1000); // Update progress every 1 second.
  }

  /**
   * Handles successful download completion.
   */
  private finishDownload(resolve: () => void) {
    this.cleanupStreams(); // Ensure all streams are properly closed
    this.item.updateStatus("completed");
    this.clearTracking();
    this.handleComplete();
    resolve();
  }

  /**
   * Handles errors during the download process.
   */
  private handleError(reject: (reason?: any) => void, message: string) {
    this.item.setError(message);
    this.item.updateStatus("error");
    this.stop();
    console.error(`[Download]: ${message}`);
    reject(new Error(message));
  }

  /**
   * Cleans up request and file streams.
   */
  private cleanupStreams() {
    if (this.request) {
      this.request.destroy();
      this.request = undefined;
    }
    if (this.fileStream) {
      this.fileStream.close();
      this.fileStream = undefined;
    }
  }

  /**
   * Clears tracking intervals for speed and progress.
   */
  private clearTracking() {
    if (this.speedInterval) clearInterval(this.speedInterval);
    if (this.progressInterval) clearInterval(this.progressInterval);
    this.speedInterval = undefined;
    this.progressInterval = undefined;
  }

  /**
   * Stops the current download and cleans up resources.
   */
  public stop() {
    this.cleanupStreams();
    this.item.updateStatus("stopped");
    this.clearTracking();
    window.emitToFrontend(download_events.status, {
      ...this.item.getReturnData(),
      status: "stopped",
    });
  }

  /**
   * Pauses the current download.
   */
  public pause() {
    if (!this.request || this.isPaused) return;
    this.isPaused = true;
    this.stop();
    this.item.updateStatus("paused");
    window.emitToFrontend(download_events.status, {
      ...this.item.getReturnData(),
      status: "paused",
    });
  }

  /**
   * Resumes a paused download.
   */
  public async resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.item.updateStatus("downloading");
    await this.download();
    window.emitToFrontend(download_events.status, {
      ...this.item.getReturnData(),
      status: "downloading",
    });
  }

  /**
   * Handles download completion events.
   */
  private handleComplete() {
    this.item.updateStatus("completed");
    this.clearTracking();
    window.emitToFrontend(download_events.status, {
      ...this.item.getReturnData(),
      status: "completed",
    });
  }

  /**
   * Registers a callback function to be called when download progress updates.
   * @param callback Function to call with progress information
   */
  public onProgress(
    callback: (progress: {
      percent: number;
      speed: number;
      eta: number;
      total: number;
    }) => void
  ): void {
    this.progressCallback = callback;

    // Update the progress tracking to use the callback
    this.progressInterval = setInterval(() => {
      if (!this.progressCallback) return;

      let progress = (this.downloadedSize / this.item.totalSize) * 100;
      progress = Math.min(Math.max(progress, 0), 100);

      if (Math.abs(progress - this.previousProgress) >= 0.002) {
        this.previousProgress = progress;
        const roundedProgress = Math.round(progress * 100) / 100;

        this.progressCallback({
          percent: roundedProgress,
          speed: this.item.downloadSpeed,
          eta: this.item.timeRemaining as number,
          total: this.item.totalSize,
        });
      }
    }, 1000);
  }
}

export { HttpDownloader };
