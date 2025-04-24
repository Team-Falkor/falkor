import { DownloadItem, DownloadProgress, DownloadStatus } from "@/@types";
import { EventEmitter } from "events";
import * as fs from "fs";
import WebTorrent from "webtorrent";
import { settings } from "../../../utils/settings/settings";
import { downloadQueue } from "../queue";

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

    // Initialize WebTorrent client
    this.client = new WebTorrent({
      utp: true,
      dht: true,
      webSeeds: true,
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
    const maxDownloadSpeed = settings.get("maxDownloadSpeed");
    const maxUploadSpeed = settings.get("maxUploadSpeed");

    if (maxDownloadSpeed && maxDownloadSpeed > 0) {
      console.log(
        "Applying throttling settings:",
        maxDownloadSpeed,
        maxUploadSpeed
      );
      this.client.throttleDownload(maxDownloadSpeed * 1024); // Convert to bytes/sec
    }

    if (maxUploadSpeed && maxUploadSpeed > 0) {
      console.log(
        "Applying throttling settings:",
        maxDownloadSpeed,
        maxUploadSpeed
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
        typeof error === "string" ? error : error.message
      );
    });
  }

  /**
   * Start a torrent download
   */
  public async startDownload(item: DownloadItem): Promise<void> {
    try {
      // Create directory if it doesn't exist
      await fs.promises.mkdir(item.path, { recursive: true, mode: 0o755 });

      console.log("Starting download:", item);

      // Add torrent to client
      this.client.add(item.url, { path: item.path }, (torrent) => {
        // Store torrent reference
        this.torrents.set(item.id, torrent);

        // Update item with torrent info
        item.name = torrent.name;
        item.size = torrent.length;

        // Setup torrent event listeners
        this.setupTorrentEventListeners(item.id, torrent);

        // Start progress tracking
        this.startProgressTracking(item.id);

        // Force an initial progress update to fix stuck at 0% bug
        this.updateProgress(item.id);
      });
    } catch (error) {
      this.handleError(
        item.id,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Setup event listeners for a specific torrent
   */
  private setupTorrentEventListeners(
    id: string,
    torrent: WebTorrent.Torrent
  ): void {
    // Handle torrent errors
    torrent.on("error", (error) => {
      this.handleError(id, typeof error === "string" ? error : error.message);
    });

    // Handle torrent completion
    torrent.on("done", () => {
      this.completeDownload(id);
    });

    // Handle metadata received
    torrent.on("metadata", () => {
      const item = downloadQueue.getDownload(id);
      if (item) {
        item.name = torrent.name;
        item.size = torrent.length;
      }
    });
  }

  /**
   * Start tracking progress for a torrent
   */
  private startProgressTracking(id: string): void {
    // Clear any existing interval
    this.stopProgressTracking(id);

    // Create new interval
    const interval = setInterval(() => {
      this.updateProgress(id);
    }, 1000); // Update every second

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
    if (!torrent) return;

    // Calculate progress percentage
    const progress = Math.min(100, torrent.progress * 100);

    // Calculate time remaining
    let timeRemaining = 0;
    if (torrent.downloadSpeed > 0) {
      const bytesRemaining = torrent.length - torrent.downloaded;
      timeRemaining = bytesRemaining / torrent.downloadSpeed;
    }

    // Create progress update
    const progressUpdate: DownloadProgress = {
      id,
      progress,
      speed: torrent.downloadSpeed,
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
    // Stop progress tracking
    this.stopProgressTracking(id);

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

    // Keep seeding but mark as complete
    // The torrent will continue to seed until the app is closed or the torrent is removed
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
    if (!torrent) return false;

    // Pause the torrent
    torrent.pause();

    // Send a progress update with paused status to ensure UI shows it as paused
    const progressUpdate: DownloadProgress = {
      id,
      progress: torrent.progress * 100,
      speed: 0,
      timeRemaining: 0,
      status: DownloadStatus.PAUSED,
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
    if (!torrent) return false;

    // Resume the torrent
    torrent.resume();

    // Start progress tracking
    this.startProgressTracking(id);

    return true;
  }

  /**
   * Cancel a download
   */
  public cancelDownload(id: string): boolean {
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

  /**
   * Destroy the client and clean up
   */
  public destroy(): void {
    // Stop all progress tracking
    for (const id of this.progressIntervals.keys()) {
      this.stopProgressTracking(id);
    }

    // Destroy client
    this.client.destroy();
  }
}

// Create and export singleton instance
export const torrentDownloadHandler = new TorrentDownloadHandler();
