import {
  AddDownloadData,
  DownloadData,
  DownloadgameData,
  DownloadStatus,
} from "@/@types";
import { createWriteStream, WriteStream } from "node:fs";
import path from "node:path";
import { logger } from "../../handlers/logging";
import { constants, sanitizeFilename } from "../../utils";
import { settings } from "../../utils/settings/settings";
import window from "../../utils/window";
import download_events from "./events";

class DownloadItem {
  id: string;
  url: string;
  filename: string;
  filePath: string;
  fileExtension: string;
  status: DownloadStatus;
  progress: number = 0;
  totalSize: number = 0;
  downloadSpeed: number = 0;
  timeRemaining: number | "completed" = 0;
  error: string = "";
  progressIntervalId?: ReturnType<typeof setInterval>;
  private fileStream?: WriteStream;

  game_data: DownloadgameData;

  constructor(data: AddDownloadData) {
    const { file_path, game_data, url, file_name, id, file_extension } = data;

    this.id = id;
    this.url = this.validateUrl(url);
    this.filename = this.validateFilename(file_name);
    this.fileExtension = file_extension ?? this.getFileExtension(url);
    this.filePath = this.validateFilePath(file_path) ?? this.getDownloadPath();
    this.status = "pending";
    this.game_data = game_data;
  }

  private validateUrl(url: string): string {
    try {
      new URL(url); // Validate URL format
      return url;
    } catch {
      throw new Error(`Invalid URL provided: ${url}`);
    }
  }

  private validateFilename(filename: string): string {
    return sanitizeFilename(filename);
  }

  private validateFilePath(filePath?: string): string | undefined {
    if (!filePath) return undefined;
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(constants.downloadsPath)) {
      throw new Error(`File path outside allowed directory: ${filePath}`);
    }
    return resolvedPath;
  }

  private getFileExtension(url: string): string {
    const fileExtFromUrl = url.split(".").pop();
    if (fileExtFromUrl && fileExtFromUrl?.length >= 1)
      return fileExtFromUrl.toLowerCase();
    return "rar";
  }

  private getDownloadPath(): string {
    return settings?.get("downloadsPath") ?? constants.downloadsPath;
  }

  public get fullPath(): string {
    return path.join(this.filePath, `${this.filename}.${this.fileExtension}`);
  }

  public updateProgress(progress: number): void {
    this.progress = progress;
  }

  public updateStatus(status: DownloadStatus): void {
    this.status = status;
  }

  public updateTimeRemaining(timeRemaining: number | "completed"): void {
    this.timeRemaining = timeRemaining;
  }

  public updateTotalSize(totalSize: number): void {
    this.totalSize = totalSize;
  }

  public updateDownloadSpeed(speed: number): void {
    this.downloadSpeed = speed;
  }

  public setError(error: string): void {
    this.error = error;
    logger.log("error", `[Download ${this.id}] ${error}`);
  }

  public createFileStream(): WriteStream | undefined {
    try {
      this.fileStream = createWriteStream(this.fullPath);
      return this.fileStream;
    } catch (error) {
      const message = `Failed to create file stream for ${this.fullPath}: ${(error as Error).message}`;
      this.setError(message);
      return undefined;
    }
  }

  public closeFileStream(): void {
    try {
      this.fileStream?.close();
    } catch (error) {
      logger.log(
        "warn",
        `Error closing file stream: ${(error as Error).message}`
      );
    }
  }

  public isCompleted(): boolean {
    return this.status === "completed";
  }

  public getReturnData(): DownloadData {
    return {
      filename: this.filename,
      game_data: this.game_data,
      path: this.filePath,
      status: this.status,
      url: this.url,
      id: this.id,
      progress: this.progress,
      totalSize: this.totalSize,
      downloadSpeed: this.downloadSpeed,
      timeRemaining: this.timeRemaining,
    };
  }

  public sendProgress(): void {
    if (this.status !== "downloading") {
      clearInterval(this.progressIntervalId);
      return;
    }

    const progressData = this.getReturnData();
    window.emitToFrontend(download_events.status, progressData);
  }
}

export { DownloadItem };
