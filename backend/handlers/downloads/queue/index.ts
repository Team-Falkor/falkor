import {
  AddDownloadOptions,
  DownloadError,
  DownloadItem,
  DownloadPriority,
  DownloadProgress,
  DownloadQueueConfig,
  DownloadStateChange,
  DownloadStatus,
  SettingsValue,
} from "@/@types";
import { EventEmitter } from "events";
import { uuidv4 } from "../../../utils";
import { constants } from "../../../utils/constants";
import { settings } from "../../../utils/settings/settings";
import window from "../../../utils/window";

export const DEFAULT_QUEUE_CONFIG: DownloadQueueConfig = {
  maxConcurrentDownloads: 3,
  maxRetries: 3,
  retryDelay: 5000,
  persistQueue: true,
};

class DownloadQueue extends EventEmitter {
  private static instance: DownloadQueue;
  private queue: Map<string, DownloadItem>;
  private activeDownloads: Set<string>;
  private priorityQueue: Map<DownloadPriority, string[]>;
  private config: DownloadQueueConfig;
  private handlers: Map<"http" | "torrent", any>;

  private constructor() {
    super();
    this.queue = new Map();
    this.activeDownloads = new Set();
    this.priorityQueue = new Map([
      ["high", []],
      ["normal", []],
      ["low", []],
    ]);
    this.config = { ...DEFAULT_QUEUE_CONFIG };
    this.handlers = new Map();
    this.loadConfig();
    this.setupEventListeners();
  }

  public static getInstance(): DownloadQueue {
    if (!DownloadQueue.instance) {
      DownloadQueue.instance = new DownloadQueue();
    }
    return DownloadQueue.instance;
  }

  private loadConfig(): void {
    const savedConfig: DownloadQueueConfig = settings.get(
      "downloadConfig"
    ) as unknown as DownloadQueueConfig;
    if (savedConfig) {
      this.config = { ...DEFAULT_QUEUE_CONFIG, ...savedConfig };
    }
  }

  private saveConfig(): void {
    settings.update("downloadConfig", this.config as unknown as SettingsValue);
  }

  private setupEventListeners(): void {}

  public registerHandler(type: "http" | "torrent", handler: any): void {
    this.handlers.set(type, handler);
  }

  public async addDownload(options: AddDownloadOptions): Promise<string> {
    const id = uuidv4();
    const now = new Date();
    const downloadsPath =
      settings.get("downloadsPath") ?? constants.downloadsPath;
    const downloadItem: DownloadItem = {
      id,
      url: options.url,
      type: options.type,
      name: options.name || `Download-${id.substring(0, 8)}`,
      path: options.path || downloadsPath,
      status: DownloadStatus.QUEUED,
      progress: 0,
      speed: 0,
      size: 0,
      timeRemaining: 0,
      paused: !options.autoStart,
      game_data: options.game_data,
      created: now,
    };
    this.queue.set(id, downloadItem);
    const priority = options.priority || "normal";
    this.priorityQueue.get(priority)?.push(id);
    this.emitStateChange(id, DownloadStatus.NONE, DownloadStatus.QUEUED);
    if (options.autoStart !== false) {
      this.processQueue();
    }
    return id;
  }

  private async processQueue(): Promise<void> {
    // Log the current download status
    console.log(
      `Active downloads: ${this.activeDownloads.size}, Max allowed: ${this.config.maxConcurrentDownloads}`
    );

    // Check if we're at max capacity
    const atMaxCapacity =
      this.activeDownloads.size >= this.config.maxConcurrentDownloads;

    // If we're at max capacity, we should still process the queue to ensure items are properly queued
    // But we won't start any new downloads until active count drops below max
    for (const priority of ["high", "normal", "low"] as DownloadPriority[]) {
      const priorityQueue = this.priorityQueue.get(priority) || [];
      for (let i = 0; i < priorityQueue.length; i++) {
        const id = priorityQueue[i];
        const download = this.queue.get(id);
        if (!download) continue;
        if (this.activeDownloads.has(id) || download.paused) continue;
        if (download.status !== DownloadStatus.QUEUED) continue;

        // Only start the download if we're below max capacity
        if (!atMaxCapacity) {
          await this.startDownload(id);
        }

        // Check if we've reached max capacity after starting this download
        if (this.activeDownloads.size >= this.config.maxConcurrentDownloads) {
          break;
        }
      }
      if (this.activeDownloads.size >= this.config.maxConcurrentDownloads) {
        break;
      }
    }
  }

  private async startDownload(id: string): Promise<void> {
    const download = this.queue.get(id);
    if (!download) return;
    const handler = this.handlers.get(download.type);
    if (!handler) {
      this.handleDownloadError(
        id,
        `No handler registered for ${download.type} downloads`
      );
      return;
    }
    this.activeDownloads.add(id);
    download.status = DownloadStatus.DOWNLOADING;
    download.started = new Date();
    this.emitStateChange(id, DownloadStatus.QUEUED, DownloadStatus.DOWNLOADING);
    try {
      await handler.startDownload(download);
    } catch (error) {
      this.handleDownloadError(
        id,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  public async pauseDownload(id: string): Promise<boolean> {
    const download = this.queue.get(id);
    if (!download) return false;
    if (download.status !== DownloadStatus.DOWNLOADING) {
      return false;
    }
    const previousStatus = download.status;
    download.status = DownloadStatus.PAUSED;
    download.paused = true;
    this.activeDownloads.delete(id);

    // Remove from all priority queues to prevent re-processing
    for (const queue of this.priorityQueue.values()) {
      const index = queue.indexOf(id);
      if (index !== -1) {
        queue.splice(index, 1);
      }
    }

    // Stop the download through the handler if available
    const handler = this.handlers.get(download.type);
    if (handler && typeof handler.pauseDownload === "function") {
      try {
        await handler.pauseDownload(id);
      } catch (error) {
        console.error(`Error stopping download ${id}: ${error}`);
      }
    }

    this.emitStateChange(id, previousStatus, DownloadStatus.PAUSED);
    // Process queue after ensuring download is fully stopped
    await this.processQueue();
    return true;
  }

  public resumeDownload(id: string): boolean {
    const download = this.queue.get(id);
    if (!download) return false;
    if (download.status !== DownloadStatus.PAUSED) {
      return false;
    }
    download.status = DownloadStatus.QUEUED;
    download.paused = false;
    // Add back to priority queue when resuming
    const priority = download.priority || "normal";
    this.priorityQueue.get(priority)?.push(id);
    this.emitStateChange(id, DownloadStatus.PAUSED, DownloadStatus.QUEUED);
    this.processQueue();
    return true;
  }

  public cancelDownload(id: string): boolean {
    const download = this.queue.get(id);
    if (!download) return false;
    const previousStatus = download.status;
    download.status = DownloadStatus.CANCELLED;
    this.activeDownloads.delete(id);
    for (const [_priority, queue] of this.priorityQueue.entries()) {
      const index = queue.indexOf(id);
      if (index !== -1) {
        queue.splice(index, 1);
        break;
      }
    }
    const handler = this.handlers.get(download.type);
    if (handler && typeof handler.cancelDownload === "function") {
      try {
        handler.cancelDownload(id);
      } catch (error) {
        console.error(`Error canceling download ${id}: ${error}`);
      }
    }
    this.emitStateChange(id, previousStatus, DownloadStatus.CANCELLED);
    this.processQueue();
    return true;
  }

  public removeDownload(id: string): boolean {
    if (this.activeDownloads.has(id)) {
      this.cancelDownload(id);
    }
    const result = this.queue.delete(id);
    return result;
  }

  public clearCompletedDownloads(): number {
    let count = 0;
    for (const [id, download] of this.queue.entries()) {
      if (
        download.status === DownloadStatus.COMPLETED ||
        download.status === DownloadStatus.FAILED ||
        download.status === DownloadStatus.CANCELLED
      ) {
        this.queue.delete(id);
        count++;
      }
    }
    return count;
  }

  public getDownloads(): DownloadItem[] {
    return Array.from(this.queue.values());
  }

  public getDownload(id: string): DownloadItem | undefined {
    return this.queue.get(id);
  }

  public setPriority(id: string, priority: DownloadPriority): boolean {
    const download = this.queue.get(id);
    if (!download) return false;
    for (const [_currentPriority, queue] of this.priorityQueue.entries()) {
      const index = queue.indexOf(id);
      if (index !== -1) {
        queue.splice(index, 1);
        break;
      }
    }
    this.priorityQueue.get(priority)?.push(id);
    return true;
  }

  public updateProgress(progress: DownloadProgress): void {
    const download = this.queue.get(progress.id);
    if (!download) return;
    download.progress = progress.progress;
    download.speed = progress.speed;
    download.timeRemaining = progress.timeRemaining;
    if (progress.status !== download.status) {
      this.emitStateChange(progress.id, download.status, progress.status);
      download.status = progress.status;
      if (progress.status === DownloadStatus.COMPLETED) {
        download.completed = new Date();
        this.activeDownloads.delete(progress.id);
        this.processQueue();
      }
    }
    window.emitToFrontend("download-queue:progress", progress);
  }

  private handleDownloadError(id: string, errorMessage: string): void {
    const download = this.queue.get(id);
    if (!download) return;
    const previousStatus = download.status;
    download.status = DownloadStatus.FAILED;
    download.error = errorMessage;
    this.activeDownloads.delete(id);
    const error: DownloadError = {
      id,
      error: errorMessage,
      status: DownloadStatus.FAILED,
      timestamp: new Date(),
    };
    window.emitToFrontend("download-queue:error", error);
    this.emitStateChange(id, previousStatus, DownloadStatus.FAILED);
    this.processQueue();
  }

  private emitStateChange(
    id: string,
    previousStatus: DownloadStatus,
    currentStatus: DownloadStatus
  ): void {
    const stateChange: DownloadStateChange = {
      id,
      previousStatus,
      currentStatus,
      timestamp: new Date(),
    };
    window.emitToFrontend("download-queue:state-change", stateChange);
  }

  public updateConfig(config: Partial<DownloadQueueConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveConfig();
    this.processQueue();
  }
}

export const downloadQueue = DownloadQueue.getInstance();
