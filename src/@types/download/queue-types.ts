import { DownloadgameData } from "./types";

/**
 * Enum representing the possible states of a download
 */
export enum DownloadStatus {
  QUEUED = "queued",
  DOWNLOADING = "downloading",
  PAUSED = "paused",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "canceled",
  NONE = "none",
}

/**
 * Interface representing a download item in the queue
 * This is used for both HTTP and torrent downloads
 */
export interface DownloadItem {
  id: string; // Unique identifier
  url: string; // Source URL or magnet link
  type: "http" | "torrent"; // Download type
  name: string; // File/torrent name
  path: string; // Destination path
  status: DownloadStatus; // Current status
  progress: number; // Progress percentage (0-100)
  speed: number; // Download speed in bytes/sec
  size: number; // Total size in bytes
  timeRemaining: number; // Estimated time remaining
  paused: boolean; // Whether download is paused
  error?: string; // Error message if failed
  game_data?: DownloadgameData; // Game metadata if applicable
  created: Date; // When download was added
  started?: Date; // When download started
  completed?: Date; // When download completed
  priority?: DownloadPriority; // Download priority level
}

/**
 * Type for download priority levels
 */
export type DownloadPriority = "high" | "normal" | "low";

/**
 * Interface for download queue configuration
 */
export interface DownloadQueueConfig {
  maxConcurrentDownloads: number;
  maxRetries: number;
  retryDelay: number; // in milliseconds
  persistQueue: boolean;
}

/**
 * Interface for adding a new download to the queue
 */
export interface AddDownloadOptions {
  url: string;
  type: "http" | "torrent";
  name?: string;
  path?: string;
  priority?: DownloadPriority;
  game_data?: DownloadgameData;
  autoStart?: boolean;
}

/**
 * Interface for download progress updates
 */
export interface DownloadProgress {
  id: string;
  progress: number;
  speed: number;
  timeRemaining: number;
  status: DownloadStatus;
  error?: string; // Optional error message if download failed
}

/**
 * Interface for download state change events
 */
export interface DownloadStateChange {
  id: string;
  previousStatus: DownloadStatus;
  currentStatus: DownloadStatus;
  timestamp: Date;
}

/**
 * Interface for download error information
 */
export interface DownloadError {
  id: string;
  error: string;
  status: DownloadStatus;
  timestamp: Date;
}
