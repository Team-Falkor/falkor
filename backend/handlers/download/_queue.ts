import EventEmitter from "events";
import { HttpDownloader } from "./http-downloader";
import { DownloadItem } from "./item";

class DownloadQueue extends EventEmitter {
  private queue: Map<string, DownloadItem> = new Map();
  private activeDownloads: Map<string, HttpDownloader> = new Map();
  private maxConcurrentDownloads: number;
  private isProcessing = false;

  constructor(maxConcurrentDownloads: number = 1) {
    super();
    this.maxConcurrentDownloads = maxConcurrentDownloads;
  }

  public addToQueue(downloadItem: DownloadItem): void {
    if (
      downloadItem.status !== "completed" &&
      !this.queue.has(downloadItem.id)
    ) {
      this.queue.set(downloadItem.id, downloadItem);
      this.emit("queueAdded", downloadItem);
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (
        this.activeDownloads.size < this.maxConcurrentDownloads &&
        this.queue.size > 0
      ) {
        const downloadItem = this.queue.values().next().value;
        if (!downloadItem) break;

        const downloader = new HttpDownloader(downloadItem);
        this.activeDownloads.set(downloadItem.id, downloader);

        this.emit("downloadStarted", downloadItem);

        try {
          await downloader.download();
          this.emit("downloadCompleted", downloadItem);
        } catch (error) {
          this.logError(`Failed to download ${downloadItem.url}`, error);
          this.emit("downloadFailed", downloadItem, error);
        } finally {
          this.activeDownloads.delete(downloadItem.id);
          this.queue.delete(downloadItem.id);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  public stopAll(): void {
    this.activeDownloads.forEach((downloader) => downloader.stop());
    this.activeDownloads.clear();
    this.queue.clear();
    this.emit("queueCleared");
  }

  public async pause(id: string): Promise<DownloadItem | null> {
    const downloader = this.activeDownloads.get(id);
    if (!downloader) return null;

    try {
      downloader.pause();
      this.emit("downloadPaused", downloader.item);
      await this.processQueue();
      return downloader.item;
    } catch (error) {
      this.logError(`Failed to pause download with id ${id}`, error);
      return null;
    }
  }

  public async resume(id: string): Promise<DownloadItem | null> {
    const downloader = this.activeDownloads.get(id);
    if (!downloader) return null;

    try {
      await downloader.resume();
      this.emit("downloadResumed", downloader.item);
      await this.processQueue();
      return downloader.item;
    } catch (error) {
      this.logError(`Failed to resume download with id ${id}`, error);
      return null;
    }
  }

  public async stop(id: string): Promise<DownloadItem | null> {
    const downloader = this.activeDownloads.get(id);
    if (!downloader) return null;

    try {
      downloader.stop();
      this.activeDownloads.delete(id);
      this.queue.delete(id);
      this.emit("downloadStopped", downloader.item);
      return downloader.item;
    } catch (error) {
      this.logError(`Failed to stop download with id ${id}`, error);
      return null;
    }
  }

  public async getDownloads(): Promise<DownloadItem[]> {
    return Array.from(this.activeDownloads.values()).map((d) => d.item);
  }

  private logError(message: string, error: unknown): void {
    console.error(`${message}:`, error);
  }
}

const downloadQueue = new DownloadQueue();
export { downloadQueue };
