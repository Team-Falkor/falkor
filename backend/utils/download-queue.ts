import {
  DownloadData,
  QueueData,
  QueueDataDownload,
  QueueDataTorrent,
} from "@/@types";
import { ITorrent } from "@/@types/torrent";
import { Torrent } from "webtorrent";
import { DownloadItem, HttpDownloader } from "../handlers/download";
import { NotificationsHandler } from "../handlers/notifications";
import { constants } from "./constants";
import { settings } from "./settings/settings";
import { client, torrents } from "./torrent";
import window from "./window";

const THROTTLE_INTERVAL = 1000; // Send progress updates every second

/**
 * Helper to extract a unique ID for a queue item.
 */
function getQueueItemId(item: QueueData): string {
  return item.type === "torrent" ? item.data.torrentId : item.data.id;
}

/**
 * Helper to determine if the downloader is a Torrent.
 */
export const isTorrent = (item: HttpDownloader | Torrent): item is Torrent => {
  return !!(item as Torrent).magnetURI;
};

interface RetryConfig {
  maxRetries: number;
  retryDelay: number; // milliseconds
  shouldRetry: (error: Error) => boolean;
}

class AllQueue {
  private queue = new Map<string, QueueData>();
  private activeDownloads = new Map<string, HttpDownloader | Torrent>();
  private retryAttempts = new Map<string, number>();
  private readonly retryConfig: RetryConfig = {
    maxRetries: 3,
    retryDelay: 5000,
    shouldRetry: (error: Error) => {
      const retryableErrors = ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED'];
      return retryableErrors.some(code => error.message.includes(code));
    }
  };

  constructor(private maxConcurrentDownloads = 1) {}

  private async cleanupDownload(id: string): Promise<void> {
    // Check if this is a torrent before removing it
    const downloader = this.activeDownloads.get(id);
    if (downloader && isTorrent(downloader)) {
      // Ensure torrent is properly destroyed and removed from torrents map
      torrents.delete(id);
    }
    
    this.activeDownloads.delete(id);
    this.queue.delete(id);
    this.retryAttempts.delete(id);
  }

  async add(item: QueueData): Promise<void> {
    const id = getQueueItemId(item);
    this.queue.set(id, item);
    window.emitToFrontend("queue:add", { id, item });
    void this.processQueue();
  }

  async remove(id: string): Promise<void> {
    this.queue.delete(id);
    window.emitToFrontend("queue:remove", { id });
  }

  getDownloads(): Array<DownloadData | ITorrent> {
    return Array.from(this.activeDownloads.values()).map((d) => {
      if (isTorrent(d)) {
        const torrent = torrents.get(d.infoHash);
        return {
          downloadSpeed: d.downloadSpeed,
          uploadSpeed: d.uploadSpeed,
          infoHash: d.infoHash,
          name: d.name,
          numPeers: d.numPeers,
          path: d.path,
          paused: d.paused,
          progress: d.progress,
          status: d.done ? "completed" : d.paused ? "paused" : "downloading",
          totalSize: d.length,
          timeRemaining: d.timeRemaining,
          game_data: torrent?.game_data,
        } as ITorrent;
      }
      return d.item.getReturnData();
    });
  }

  private isProcessingQueue = false;

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) return;

    try {
      this.isProcessingQueue = true;

      while (
        this.queue.size > 0 &&
        this.activeDownloads.size < this.maxConcurrentDownloads
      ) {
        const entry = this.queue.entries().next();
        if (entry.done) break;
        const [id, item] = entry.value;
        if (!item) break;

        // Remove from queue before processing to prevent duplicates
        this.queue.delete(id);
        window.emitToFrontend("queue:remove", { id });

        try {
          // Emit download start event
          window.emitToFrontend("download:start", { id, item });

          if (item.type === "torrent") {
            await this.processTorrent(item as QueueDataTorrent);
          } else if (item.type === "download") {
            await this.processDownload(item as QueueDataDownload);
          }
        } catch (error) {
          window.emitToFrontend("queue:error", {
            id,
            error: (error as Error).message,
          });
        }
      }
    } finally {
      this.isProcessingQueue = false;
      // Check if there are more items to process
      if (this.queue.size > 0 && this.activeDownloads.size < this.maxConcurrentDownloads) {
        void this.processQueue();
      }
    }
  }

  private async processTorrent(item: QueueDataTorrent): Promise<void> {
    const id = item.data.torrentId;
    const currentAttempt = this.retryAttempts.get(id) || 0;

    return new Promise((resolve, reject) => {
      const handleTorrentError = async (error: Error) => {
        const shouldRetry = this.retryConfig.shouldRetry(error) &&
                           currentAttempt < this.retryConfig.maxRetries;

        if (shouldRetry) {
          this.retryAttempts.set(id, currentAttempt + 1);
          window.emitToFrontend("torrent:retry", {
            infoHash: id,
            attempt: currentAttempt + 1,
            maxRetries: this.retryConfig.maxRetries,
            error: error.message
          });

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, this.retryConfig.retryDelay));
          await this.add(item);
          resolve();
        } else {
          window.emitToFrontend("torrent:error", {
            infoHash: id,
            error: error.message,
            attempts: currentAttempt + 1
          });
          reject(error);
        }
      };

      // Use the proper addTorrent method from the client
      client.addTorrent(
        id,
        item.data.game_data,
        { path: settings.get("downloadsPath") ?? constants.downloadsPath }
      )
        .then(torrentWithData => {
          const torrent = torrentWithData;
          
          // Helper to generate live torrent status data
          const getTorrentStatus = (): ITorrent => ({
            infoHash: torrent.infoHash,
            name: torrent.name,
            progress: torrent.progress,
            numPeers: torrent.numPeers,
            downloadSpeed: torrent.downloadSpeed,
            uploadSpeed: torrent.uploadSpeed,
            totalSize: torrent.length,
            timeRemaining: torrent.timeRemaining,
            paused: torrent.paused,
            status: torrent.done
              ? "completed"
              : torrent.paused
                ? "paused"
                : "downloading",
            path: torrent.path,
            game_data: item.data.game_data,
          });

          // Store in active downloads
          this.activeDownloads.set(torrent.infoHash, torrent);
          this.queue.delete(torrent.infoHash);

          // Emit initial status
          window.emitToFrontend("torrent:status", getTorrentStatus());

          // Local throttling per torrent
          let lastUpdateTime = 0;
          torrent.on("download", () => {
            const now = Date.now();
            if (now - lastUpdateTime >= THROTTLE_INTERVAL) {
              this.activeDownloads.set(torrent.infoHash, torrent);
              window.emitToFrontend("torrent:status", getTorrentStatus());
              lastUpdateTime = now;
            }
          });

          torrent.on("done", () => {
            try {
              this.completeDownload(torrent.infoHash);
              window.emitToFrontend("torrent:status", getTorrentStatus());
              resolve();
            } catch (error) {
              console.error(`Error handling torrent completion for ${torrent.infoHash}:`, error);
              reject(error);
            }
          });

          torrent.on("error", async (error) => {
            try {
              console.error(`Torrent error for ${torrent.infoHash}:`, error);
              await this.cleanupDownload(torrent.infoHash);
              await handleTorrentError(error as Error);
            } catch (handlerError) {
              console.error(`Error in torrent error handler for ${torrent.infoHash}:`, handlerError);
              reject(handlerError);
            }
          });

          // Cleanup on process exit - use a named function to avoid memory leaks
          const exitHandler = () => {
            try {
              this.stopDownloader(torrent);
            } catch (error) {
              console.error(`Error stopping torrent ${torrent.infoHash} on exit:`, error);
            }
          };
          process.on("exit", exitHandler);
          
          // Remove the exit handler when torrent is done or removed
          torrent.once("done", () => {
            process.removeListener("exit", exitHandler);
          });
        })
        .catch(async (error) => {
          console.error(`Error adding torrent ${id}:`, error);
          try {
            await handleTorrentError(error as Error);
          } catch (handlerError) {
            console.error(`Error in torrent error handler for ${id}:`, handlerError);
            reject(handlerError);
          }
        });

      // Note: client error handlers should be set up once at class initialization,
      // not for each torrent. This is handled in the TorrentClient class.
    });
  }

  private async processDownload(item: QueueDataDownload): Promise<void> {
    const id = item.data.id;
    const currentAttempt = this.retryAttempts.get(id) || 0;

    try {
      const downloadItem = new DownloadItem(item.data);
      const downloader = new HttpDownloader(downloadItem);

      this.activeDownloads.set(id, downloader);
      this.queue.delete(id);

      try {
        await downloader.download();
        // Reset retry attempts on successful download
        this.retryAttempts.delete(id);
      } catch (error) {
        const shouldRetry = this.retryConfig.shouldRetry(error as Error) &&
                           currentAttempt < this.retryConfig.maxRetries;

        if (shouldRetry) {
          this.retryAttempts.set(id, currentAttempt + 1);
          window.emitToFrontend("download:retry", {
            id,
            attempt: currentAttempt + 1,
            maxRetries: this.retryConfig.maxRetries,
            error: (error as Error).message
          });

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, this.retryConfig.retryDelay));
          await this.add(item);
          return;
        } else {
          window.emitToFrontend("download:error", {
            id,
            error: (error as Error).message,
            attempts: currentAttempt + 1
          });
        }
      }
    } catch (error) {
      console.error(`Critical error processing download ${id}:`, error);
      window.emitToFrontend("download:error", {
        id,
        error: `Critical error: ${(error as Error).message}`,
        attempts: currentAttempt + 1
      });
    } finally {
      await this.completeDownload(id);
      void this.processQueue();
    }
  }

  private async completeDownload(id: string): Promise<void> {
    const activeDownload = this.activeDownloads.get(id);
    if (!activeDownload) return;

    const item = isTorrent(activeDownload)
      ? torrents.get(id)
      : activeDownload.item.getReturnData();

    if (!item) return;

    // Use a type-safe check: if the item has a "done" property, verify it is complete;
    // otherwise, check that its progress is at least 99.
    const isComplete = "done" in item
      ? item.done
      : item.progress && item.progress >= 99;

    if (!isComplete) return;

    try {
      // Ensure proper cleanup of resources
      if (isTorrent(activeDownload)) {
        activeDownload.destroy();
        torrents.delete(id);
      } else {
        activeDownload.stop();
      }

      // Clean up queue resources
      await this.cleanupDownload(id);

      // Emit final status update
      const status = isTorrent(activeDownload)
        ? { ...item, status: "completed" as const }
        : { ...item, status: "completed" as const };
      
      window.emitToFrontend(
        isTorrent(activeDownload) ? "torrent:status" : "download:status",
        status
      );

      if (item.game_data && item.game_data.name) {
        await this.notification(
          item.game_data.name,
          `https://images.igdb.com/igdb/image/upload/t_original/${
            item.game_data.image_id ?? item.game_data.banner_id
          }.png`
        );
      }
    } catch (error) {
      console.error(`Error completing download ${id}:`, error);
    }
  }

  private async notification(title: string, icon: string | null | undefined) {
    NotificationsHandler.constructNotification(
      {
        title: title,
        body: "Download completed",
        icon: icon ? await NotificationsHandler.createImage(icon) : undefined,
        notificationType: "download_completed",
      },
      true
    );
  }

  async stopAll(): Promise<void> {
    for (const downloader of this.activeDownloads.values()) {
      this.stopDownloader(downloader);
    }
    this.activeDownloads.clear();
    this.queue.clear();
    window.emitToFrontend("queue:clear");
  }

  async stop(id: string): Promise<boolean> {
    try {
      const downloader = this.activeDownloads.get(id);
      if (!downloader) {
        console.warn(`No active download found with ID ${id}`);
        return false;
      }

      this.stopDownloader(downloader);

      // Emit stopped status before cleanup
      if (isTorrent(downloader)) {
        const torrentData = torrents.get(id);
        if (torrentData) {
          const status = {
            infoHash: torrentData.infoHash,
            name: torrentData.name,
            progress: 0,
            status: "stopped" as const,
            downloadSpeed: 0,
            uploadSpeed: 0,
            numPeers: 0,
            timeRemaining: 0,
            totalSize: torrentData.length,
            path: torrentData.path,
            game_data: torrentData.game_data
          };
          window.emitToFrontend("torrent:status", status);
          
          // Explicitly remove from torrents map
          torrents.delete(id);
        }
      } else {
        const status = {
          id: downloader.item.id,
          filename: downloader.item.filename,
          status: "stopped" as const,
          progress: 0,
          downloadSpeed: 0,
          timeRemaining: 0,
          totalSize: downloader.item.totalSize,
          path: downloader.item.filePath,
          game_data: downloader.item.game_data
        };
        window.emitToFrontend("download:status", status);
      }

      // Clean up resources
      this.activeDownloads.delete(id);
      this.queue.delete(id);
      window.emitToFrontend("queue:stop", { id });

      // Process next item in queue
      void this.processQueue();
      return true;
    } catch (error) {
      console.error(`Error stopping download with ID ${id}:`, error);
      return false;
    }
  }

  async pause(id: string): Promise<boolean> {
    try {
      const downloader = this.activeDownloads.get(id);
      if (!downloader) {
        console.warn(`No active download found with ID ${id}`);
        return false;
      }

      if (isTorrent(downloader)) {
        downloader.pause();
        const status = {
          ...torrents.get(id),
          status: "paused" as const,
          paused: true
        };
        window.emitToFrontend("torrent:status", status);
      } else {
        downloader.pause();
        const status = {
          ...downloader.item.getReturnData(),
          status: "paused" as const
        };
        window.emitToFrontend("download:status", status);
      }

      window.emitToFrontend("queue:pause", { id });
      return true;
    } catch (error) {
      console.error(`Error pausing download with ID ${id}:`, error);
      return false;
    }
  }

  async resume(id: string): Promise<boolean> {
    try {
      const downloader = this.activeDownloads.get(id);
      if (!downloader) {
        console.warn(`No active download found with ID ${id}`);
        return false;
      }

      if (isTorrent(downloader)) {
        downloader.resume();
        const status = {
          ...torrents.get(id),
          status: "downloading" as const,
          paused: false
        };
        window.emitToFrontend("torrent:status", status);
      } else {
        downloader.resume();
        const status = {
          ...downloader.item.getReturnData(),
          status: "downloading" as const
        };
        window.emitToFrontend("download:status", status);
      }

      window.emitToFrontend("queue:resume", { id });
      return true;
    } catch (error) {
      console.error(`Error resuming download with ID ${id}:`, error);
      return false;
    }
  }

  private stopDownloader(downloader: HttpDownloader | Torrent): void {
    if (isTorrent(downloader)) {
      // Get the infoHash before destroying the torrent
      const infoHash = downloader.infoHash;
      
      // Destroy the torrent
      downloader.destroy();
      
      // Ensure it's removed from the torrents map
      if (infoHash) {
        torrents.delete(infoHash);
      }
    } else {
      downloader.stop();
    }
  }

  updateMaxConcurrentDownloads(maxConcurrentDownloads: number): void {
    this.maxConcurrentDownloads = maxConcurrentDownloads;
  }

  getQueueItems(): QueueData[] {
    return Array.from(this.queue.values());
  }
}

const downloadQueue = new AllQueue();

export { downloadQueue };
