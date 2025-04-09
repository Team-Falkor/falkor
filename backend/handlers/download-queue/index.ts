import { EventEmitter } from "events";
import WebTorrent from "webtorrent";
import {
  DownloadData,
  DownloadgameData,
  DownloadQueueEvent,
  DownloadQueueOptions,
  DownloadState,
  QueueData,
  QueueDataDownload,
  QueueDataTorrent,
} from "../../../src/@types";
import { ITorrent } from "../../../src/@types/torrent";
import { constants } from "../../utils";
import { settings } from "../../utils/settings/settings";
import window from "../../utils/window";
import download_events from "../download/events";
import { HttpDownloader } from "../download/http-downloader";
import { DownloadItem } from "../download/item";
import { torrentClient } from "../torrent/client";

// Extend WebTorrent.Torrent type to include game_data
type ExtendedTorrent = WebTorrent.Torrent & { game_data?: DownloadgameData };

/**
 * Default retry configuration
 */
// const DEFAULT_RETRY_CONFIG: RetryConfig = {
//   maxRetries: 3,
//   retryDelay: 5000, // 5 seconds
//   shouldRetry: (error: Error) => {
//     // Retry on network errors or server errors (5xx)
//     return error.message.includes('network') ||
//            error.message.includes('timeout') ||
//            error.message.includes('500') ||
//            error.message.includes('503');
//   }
// };

/**
 * DownloadQueue
 * A unified queue system that handles both HTTP downloads and torrents
 */
class DownloadQueue extends EventEmitter {
  private queue: Map<string, QueueData> = new Map();
  private activeDownloads: Map<string, DownloadState> = new Map();
  private httpDownloaders: Map<string, HttpDownloader> = new Map();
  private maxConcurrentDownloads: number;
  private isProcessing: boolean = false;
  private throttleInterval: number;
  private statusUpdateInterval?: NodeJS.Timeout;

  constructor(options?: DownloadQueueOptions) {
    super();
    this.maxConcurrentDownloads = options?.maxConcurrentDownloads || 1;
    this.throttleInterval = options?.throttleInterval || 1000; // Default to 1 second

    // Initialize status update interval
    this.startStatusUpdateInterval();

    // Listen for torrent client events
    this.setupTorrentClientListeners();
  }

  /**
   * Start the status update interval to periodically emit status updates
   */
  private startStatusUpdateInterval(): void {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
    }

    this.statusUpdateInterval = setInterval(() => {
      this.emitStatusUpdates();
    }, this.throttleInterval);
  }

  /**
   * Set up listeners for torrent client events
   */
  private setupTorrentClientListeners(): void {
    torrentClient.on("torrent", (torrent: ExtendedTorrent) => {
      // When a new torrent is added
      const id = torrent.infoHash;

      // Update active downloads with the new torrent
      this.updateTorrentState(torrent);

      // Remove from queue if it was queued
      this.queue.delete(id);

      // Emit event
      this.emit(DownloadQueueEvent.TORRENT_ADDED, this.getTorrentData(torrent));
    });

    torrentClient.on("error", (err) => {
      console.error("[TorrentClient] Error:", err);
      this.emit(
        DownloadQueueEvent.TORRENT_ERROR,
        err instanceof Error ? err : new Error(String(err))
      );
    });
  }

  /**
   * Update the state of a torrent in the active downloads map
   */
  private updateTorrentState(torrent: ExtendedTorrent): void {
    const id = torrent.infoHash;
    const existingState = this.activeDownloads.get(id);

    // Ensure game_data is preserved
    const game_data = existingState?.game_data || torrent.game_data;

    const state: DownloadState = {
      id,
      status: torrent.paused
        ? "paused"
        : torrent.done
          ? "completed"
          : "downloading",
      progress: torrent.progress,
      downloadSpeed: torrent.downloadSpeed,
      uploadSpeed: torrent.uploadSpeed,
      numPeers: torrent.numPeers,
      totalSize: torrent.length,
      timeRemaining: torrent.done ? "completed" : torrent.timeRemaining,
      path: torrent.path,
      lastUpdated: Date.now(),
      game_data: game_data, // Ensure game_data is always included
    };

    // Log game_data for debugging
    if (!game_data) {
      console.log(`[DownloadQueue] Warning: No game_data for torrent ${id}`);
    }

    this.activeDownloads.set(id, state);
  }

  /**
   * Convert a torrent to ITorrent format
   */
  private getTorrentData(torrent: ExtendedTorrent): ITorrent {
    // Get game_data from active downloads or from torrent object
    const game_data =
      this.activeDownloads.get(torrent.infoHash)?.game_data ||
      torrent.game_data;

    // Log warning if game_data is missing
    if (!game_data) {
      console.log(
        `[DownloadQueue] Warning: No game_data for torrent ${torrent.infoHash}`
      );
    }

    return {
      infoHash: torrent.infoHash,
      name: torrent.name,
      progress: torrent.progress,
      downloadSpeed: torrent.downloadSpeed,
      uploadSpeed: torrent.uploadSpeed,
      numPeers: torrent.numPeers,
      path: torrent.path,
      paused: torrent.paused,
      status: torrent.paused
        ? "paused"
        : torrent.done
          ? "completed"
          : "downloading",
      totalSize: torrent.length,
      timeRemaining: torrent.done ? 0 : torrent.timeRemaining,
      game_data: game_data, // Ensure game_data is always included
      url: torrent.magnetURI,
    };
  }

  /**
   * Emit status updates for all active downloads
   */
  private emitStatusUpdates(): void {
    // Update torrent states
    torrentClient.torrents.forEach((torrent) => {
      this.updateTorrentState(torrent);
      const torrentData = this.getTorrentData({
        ...torrent,
        game_data: this.activeDownloads.get(torrent.infoHash)?.game_data,
      });

      // Log warning if game_data is missing
      if (!torrentData.game_data) {
        console.log(
          `[DownloadQueue] Warning: Emitting torrent status without game_data for ${torrent.infoHash}`
        );
      }

      window.emitToFrontend(download_events.status, torrentData);
    });

    // Emit download status updates
    this.httpDownloaders.forEach((downloader) => {
      const state = this.activeDownloads.get(downloader.item.id);
      if (state) {
        // Log warning if game_data is missing
        if (!state.game_data) {
          console.log(
            `[DownloadQueue] Warning: Emitting download status without game_data for ${state.id}`
          );
        }

        window.emitToFrontend(download_events.status, {
          id: state.id,
          url: state.url,
          filename: downloader.item.filename,
          game_data: state.game_data,
          path: state.path,
          downloadSpeed: state.downloadSpeed,
          progress: state.progress,
          totalSize: state.totalSize,
          status: state.status,
          timeRemaining: state.timeRemaining,
        });
      }
    });
  }

  /**
   * Add an item to the download queue
   */
  public async add(item: QueueData): Promise<boolean> {
    try {
      const id = item.type === "torrent" ? item.data.torrentId : item.data.id;

      // Check if already in queue or active downloads
      if (this.queue.has(id) || this.activeDownloads.has(id)) {
        console.log(
          `[DownloadQueue] Item ${id} already in queue or active downloads`
        );
        return false;
      }

      // Add to queue
      this.queue.set(id, item);

      // Emit event
      this.emit(DownloadQueueEvent.DOWNLOAD_ADDED, item);

      // Process queue
      this.processQueue();

      console.log({
        queue: [...this.queue.values()],
        active: [...this.activeDownloads.values()],
      });

      return true;
    } catch (error) {
      console.error("[DownloadQueue] Error adding item to queue:", error);
      return false;
    }
  }

  /**
   * Process the download queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (
        this.activeDownloads.size < this.maxConcurrentDownloads &&
        this.queue.size > 0
      ) {
        const entry = this.queue.entries().next().value;
        if (!entry) break;
        const [id, item] = entry;
        if (!item) break;

        // Remove from queue
        this.queue.delete(id);

        if (item.type === "torrent") {
          await this.startTorrentDownload({
            data: {
              torrentId: item.data.torrentId,
              game_data: item.data.game_data,
            },
            type: "torrent",
          });
        } else {
          await this.startHttpDownload(item);
        }
      }
    } catch (error) {
      console.error("[DownloadQueue] Error processing queue:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Start a torrent download
   */
  private async startTorrentDownload(item: QueueDataTorrent): Promise<void> {
    try {
      const { torrentId, game_data } = item.data;

      // Create initial state
      const state: DownloadState = {
        id: torrentId,
        status: "pending",
        progress: 0,
        downloadSpeed: 0,
        game_data,
        lastUpdated: Date.now(),
      };

      this.activeDownloads.set(torrentId, state);

      // Emit event
      this.emit(DownloadQueueEvent.TORRENT_STARTED, {
        infoHash: torrentId,
        game_data,
      });

      // Get download path
      const downloadPath =
        settings?.get("downloadsPath") ?? constants.downloadsPath;

      // Add torrent to client
      torrentClient.add(torrentId, { path: downloadPath }, (torrent) => {
        console.log(`[DownloadQueue] Torrent added: ${torrent.infoHash}`);

        // Set up torrent event listeners
        torrent.on("download", () => {
          this.updateTorrentState(torrent);
          this.emit(
            DownloadQueueEvent.TORRENT_PROGRESS,
            this.getTorrentData(torrent)
          );
        });

        torrent.on("done", () => {
          this.updateTorrentState(torrent);
          this.emit(
            DownloadQueueEvent.TORRENT_COMPLETED,
            this.getTorrentData(torrent)
          );

          // Process queue for next download
          this.processQueue();
        });

        torrent.on("error", (err) => {
          const errorMessage = err instanceof Error ? err.message : String(err);
          console.error(`[DownloadQueue] Torrent error: ${errorMessage}`);
          this.emit(DownloadQueueEvent.TORRENT_ERROR, {
            infoHash: torrent.infoHash,
            error: errorMessage,
          });

          // Process queue for next download
          this.processQueue();
        });
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        "[DownloadQueue] Error starting torrent download:",
        errorMessage
      );
      this.emit(DownloadQueueEvent.TORRENT_FAILED, {
        torrentId: item.data.torrentId,
        error: errorMessage,
      });

      // Process queue for next download
      this.processQueue();
    }
  }

  /**
   * Start an HTTP download
   */
  private async startHttpDownload(item: QueueDataDownload): Promise<void> {
    try {
      const { id, url, file_name, game_data } = item.data;

      // Create download item
      const downloadItem = new DownloadItem(item.data);

      // Create HTTP downloader
      const downloader = new HttpDownloader(downloadItem);

      // Create initial state
      const state: DownloadState = {
        id,
        url,
        filename: file_name,
        status: "pending",
        progress: 0,
        downloadSpeed: 0,
        game_data,
        path: downloadItem.filePath,
        lastUpdated: Date.now(),
      };

      // Add to active downloads and downloaders
      this.activeDownloads.set(id, state);
      this.httpDownloaders.set(id, downloader);

      // Emit event
      this.emit(DownloadQueueEvent.DOWNLOAD_STARTED, {
        id,
        url,
        filename: file_name,
        game_data,
      });

      // Set up progress callback
      downloader.setProgressCallback(
        (progress: {
          percent: number;
          speed: number;
          eta: number;
          total: number;
        }) => {
          const updatedState = this.activeDownloads.get(id);
          if (updatedState) {
            updatedState.progress = progress.percent;
            updatedState.downloadSpeed = progress.speed;
            updatedState.timeRemaining = progress.eta;
            updatedState.totalSize = progress.total;
            updatedState.lastUpdated = Date.now();

            this.activeDownloads.set(id, updatedState);

            // Emit progress event
            this.emit(DownloadQueueEvent.DOWNLOAD_PROGRESS, {
              id,
              progress: progress.percent,
              downloadSpeed: progress.speed,
              timeRemaining: progress.eta,
              totalSize: progress.total,
            });
          }
        }
      );

      // Start download
      await downloader.download();

      // Update state to completed
      const updatedState = this.activeDownloads.get(id);
      if (updatedState) {
        updatedState.status = "completed";
        updatedState.progress = 1;
        updatedState.timeRemaining = "completed";
        updatedState.lastUpdated = Date.now();

        this.activeDownloads.set(id, updatedState);
      }

      // Emit completed event
      this.emit(DownloadQueueEvent.DOWNLOAD_COMPLETED, {
        id,
        url,
        filename: file_name,
        game_data,
        path: downloadItem.filePath,
        status: "completed",
        progress: 1,
        totalSize: downloadItem.totalSize,
        downloadSpeed: 0,
        timeRemaining: "completed",
      });

      // Remove from active downloaders
      this.httpDownloaders.delete(id);

      // Process queue for next download with a small delay to ensure cleanup is complete
      setTimeout(() => this.processQueue(), 100);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        "[DownloadQueue] Error starting HTTP download:",
        errorMessage
      );

      // Update state to error
      const updatedState = this.activeDownloads.get(item.data.id);
      if (updatedState) {
        updatedState.status = "error";
        updatedState.error = errorMessage;
        updatedState.lastUpdated = Date.now();

        this.activeDownloads.set(item.data.id, updatedState);
      }

      // Emit error event
      this.emit(DownloadQueueEvent.DOWNLOAD_FAILED, {
        id: item.data.id,
        error: errorMessage,
      });

      // Remove from active downloaders
      this.httpDownloaders.delete(item.data.id);

      // Process queue for next download
      this.processQueue();
    }
  }

  /**
   * Pause a download
   */
  public async pause(id: string): Promise<boolean> {
    try {
      // Check if it's a torrent
      const torrent = torrentClient.torrents.find((t) => t.infoHash === id);
      if (torrent) {
        torrent.pause();

        console.log(`[DownloadQueue] Paused torrent: ${id}`);

        // Update state
        const state = this.activeDownloads.get(id);
        if (state) {
          state.status = "paused";
          state.lastUpdated = Date.now();
          this.activeDownloads.set(id, state);
        }

        // Emit event
        this.emit(
          DownloadQueueEvent.TORRENT_PAUSED,
          this.getTorrentData(torrent)
        );
        return true;
      }

      // Check if it's an HTTP download
      const downloader = this.httpDownloaders.get(id);
      if (downloader) {
        downloader.pause();

        console.log(`[DownloadQueue] Paused download: ${id}`);

        // Update state
        const state = this.activeDownloads.get(id);
        if (state) {
          state.status = "paused";
          state.lastUpdated = Date.now();
          this.activeDownloads.set(id, state);
        }

        // Emit event
        this.emit(DownloadQueueEvent.DOWNLOAD_PAUSED, {
          id,
          status: "paused",
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error(`[DownloadQueue] Error pausing download ${id}:`, error);
      return false;
    }
  }

  /**
   * Resume a download
   */
  public async resume(id: string): Promise<boolean> {
    try {
      // Check if it's a torrent
      const torrent = torrentClient.torrents.find((t) => t.infoHash === id);
      if (torrent) {
        torrent.resume();

        console.log(`[DownloadQueue] Resumed torrent: ${id}`);

        // Update state
        const state = this.activeDownloads.get(id);
        if (state) {
          state.status = "downloading";
          state.lastUpdated = Date.now();
          this.activeDownloads.set(id, state);
        }

        // Emit event
        this.emit(
          DownloadQueueEvent.TORRENT_RESUMED,
          this.getTorrentData(torrent)
        );
        return true;
      }

      // Check if it's an HTTP download
      const downloader = this.httpDownloaders.get(id);
      if (downloader) {
        await downloader.resume();

        console.log(`[DownloadQueue] Resumed download: ${id}`);

        // Update state
        const state = this.activeDownloads.get(id);
        if (state) {
          state.status = "downloading";
          state.lastUpdated = Date.now();
          this.activeDownloads.set(id, state);
        }

        // Emit event
        this.emit(DownloadQueueEvent.DOWNLOAD_RESUMED, {
          id,
          status: "downloading",
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error(`[DownloadQueue] Error resuming download ${id}:`, error);
      return false;
    }
  }

  /**
   * Stop a download
   */
  public async stop(id: string): Promise<boolean> {
    try {
      // Check if it's a torrent
      const torrent = torrentClient.torrents.find((t) => t.infoHash === id);
      if (torrent) {
        await torrent.destroy();

        console.log(`[DownloadQueue] Stopped torrent: ${id}`);

        // Remove from active downloads
        this.activeDownloads.delete(id);
        this.queue.delete(id);

        // Emit event
        this.emit(DownloadQueueEvent.TORRENT_STOPPED, { infoHash: id });

        // Process queue for next download
        setTimeout(() => this.processQueue(), 100); // Small delay to ensure cleanup is complete
        return true;
      }

      // Check if it's an HTTP download
      const downloader = this.httpDownloaders.get(id);
      if (downloader) {
        downloader.stop();

        console.log(`[DownloadQueue] Stopped download: ${id}`);

        // Remove from active downloads and downloaders
        this.activeDownloads.delete(id);
        this.httpDownloaders.delete(id);

        // Emit event
        this.emit(DownloadQueueEvent.DOWNLOAD_STOPPED, { id });

        // Process queue for next download
        setTimeout(() => this.processQueue(), 100); // Small delay to ensure cleanup is complete
        return true;
      }

      return false;
    } catch (error) {
      console.error(`[DownloadQueue] Error stopping download ${id}:`, error);
      // Ensure we still try to process the queue even if there was an error
      setTimeout(() => this.processQueue(), 100);
      return false;
    }
  }

  /**
   * Stop all downloads
   */
  public async stopAll(): Promise<boolean> {
    try {
      // Stop all torrents
      torrentClient.torrents.forEach((torrent) => {
        torrent.destroy();
        console.log(`[DownloadQueue] Stopped torrent: ${torrent.infoHash}`);
      });

      // Stop all HTTP downloads
      this.httpDownloaders.forEach((downloader) => {
        downloader.stop();
        console.log(`[DownloadQueue] Stopped download: ${downloader.item.id}`);
      });

      // Clear all maps
      this.activeDownloads.clear();
      this.httpDownloaders.clear();
      this.queue.clear();

      // Emit event
      this.emit(DownloadQueueEvent.QUEUE_CLEARED);

      return true;
    } catch (error) {
      console.error("[DownloadQueue] Error stopping all downloads:", error);
      return false;
    }
  }

  /**
   * Get all active downloads
   */
  public async getDownloads(): Promise<Array<DownloadData | ITorrent>> {
    const downloads: Array<DownloadData | ITorrent> = [];

    // Get all torrents
    torrentClient.torrents.forEach((torrent) => {
      downloads.push(this.getTorrentData(torrent));
    });

    // Get all HTTP downloads
    this.httpDownloaders.forEach((downloader) => {
      const state = this.activeDownloads.get(downloader.item.id);
      if (state) {
        downloads.push({
          id: state.id,
          url: state.url!,
          filename: downloader.item.filename,
          game_data: state.game_data!,
          path: state.path,
          downloadSpeed: state.downloadSpeed,
          progress: state.progress,
          totalSize: state.totalSize,
          status: state.status,
          timeRemaining: state.timeRemaining,
        });
      }
    });

    return downloads;
  }

  /**
   * Get all queued downloads
   */
  public async getQueue(): Promise<QueueData[]> {
    return Array.from(this.queue.values());
  }

  /**
   * Update the maximum number of concurrent downloads
   */
  public updateMaxConcurrentDownloads(max: number): void {
    this.maxConcurrentDownloads = max;
    this.processQueue();
  }

  /**
   * Update the throttle interval
   */
  public updateThrottleInterval(interval: number): void {
    this.throttleInterval = interval;
    this.startStatusUpdateInterval();
  }

  /**
   * Get a download by ID
   */
  public getDownloadById(
    id: string
  ): DownloadData | ITorrent | QueueData | undefined {
    // Check active downloads
    const torrent = torrentClient.torrents.find((t) => t.infoHash === id);
    if (torrent) {
      const torrentData = this.getTorrentData({
        ...torrent,
        game_data: this.activeDownloads.get(id)?.game_data,
      });

      // Log warning if game_data is missing
      if (!torrentData.game_data) {
        console.log(
          `[DownloadQueue] Warning: Returning torrent data without game_data for ${id}`
        );
      }

      return torrentData;
    }

    // Check HTTP downloads
    const downloader = this.httpDownloaders.get(id);
    if (downloader) {
      const state = this.activeDownloads.get(id);
      if (state) {
        // Log warning if game_data is missing
        if (!state.game_data) {
          console.log(
            `[DownloadQueue] Warning: Returning download data without game_data for ${id}`
          );
        }

        return {
          id: state.id,
          url: state.url!,
          filename: downloader.item.filename,
          game_data: state.game_data!,
          path: state.path,
          downloadSpeed: state.downloadSpeed,
          progress: state.progress,
          totalSize: state.totalSize,
          status: state.status,
          timeRemaining: state.timeRemaining,
        };
      }
    }

    // Check queue
    const queueItem = this.queue.get(id);

    // Log warning if game_data is missing in queue item
    if (
      queueItem &&
      queueItem.type === "torrent" &&
      !queueItem.data.game_data
    ) {
      console.log(
        `[DownloadQueue] Warning: Queue item (torrent) missing game_data for ${id}`
      );
    } else if (
      queueItem &&
      queueItem.type === "download" &&
      !queueItem.data.game_data
    ) {
      console.log(
        `[DownloadQueue] Warning: Queue item (download) missing game_data for ${id}`
      );
    }

    return queueItem;
  }

  /**
   * Get the number of active downloads
   */
  public getActiveDownloadsCount(): number {
    return this.activeDownloads.size;
  }
}

// Create and export a singleton instance
const downloadQueue = new DownloadQueue({
  maxConcurrentDownloads: settings?.get("maxConcurrentDownloads") || 1,
  throttleInterval: 1000, // 1 second
});

export { downloadQueue };
