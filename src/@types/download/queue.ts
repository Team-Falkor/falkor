import type { DownloadgameData } from "./types";

/**
 * Enum representing the possible states of a download.
 */
export enum DownloadStatus {
	QUEUED = "queued",
	DOWNLOADING = "downloading",
	PAUSED = "paused",
	COMPLETED = "completed",
	FAILED = "failed",
	CANCELLED = "canceled",
	NONE = "none",
	UNZIPPING = "unzipping",
	UNRARRING = "unraring",
	CACHING_DEBRID = "caching_debrid",
}

/**
 * Interface representing a download item in the queue.
 * This is used for both HTTP and torrent downloads.
 */
export interface DownloadItem {
	/** Unique identifier for the download. */
	id: string;
	/** Source URL or magnet link for the download. */
	url: string;
	/** Type of download (HTTP or torrent). */
	type: "http" | "torrent";
	/** Name of the file/torrent. */
	name: string;
	/** Destination path where the file will be saved. */
	path: string;
	/** Current status of the download. */
	status: DownloadStatus;
	/** Progress percentage of the download (0-100). */
	progress: number;
	/** Download speed in bytes/sec. */
	speed: number;
	/** Total size of the file in bytes. */
	size: number;
	/** Estimated time remaining for the download in seconds. */
	timeRemaining: number;
	/** Indicates whether the download is currently paused. */
	paused: boolean;
	/** Optional: Error message if the download failed. */
	error?: string;
	/** Optional: Game metadata if the download is related to a game. */
	game_data?: DownloadgameData;
	/** Timestamp when the download was added to the queue. */
	created: Date;
	/** Optional: Timestamp when the download started. */
	started?: Date;
	/** Optional: Timestamp when the download completed. */
	completed?: Date;
	/** Optional: Priority level of the download. */
	priority?: DownloadPriority;
	/** Optional: The name of the file currently being processed during extraction (unzipping/unraring). */
	currentFile?: string;
}

/**
 * Type for download priority levels.
 */
export type DownloadPriority = "high" | "normal" | "low";

/**
 * Interface for download queue configuration.
 */
export interface DownloadQueueConfig {
	/** Maximum number of downloads that can run concurrently. */
	maxConcurrentDownloads: number;
	/** Maximum number of retries for a failed download. */
	maxRetries: number;
	/** Delay in milliseconds before retrying a failed download. */
	retryDelay: number;
	/** Whether the download queue should be persisted across application restarts. */
	persistQueue: boolean;
}

/**
 * Interface for options when adding a new download to the queue.
 */
export interface AddDownloadOptions {
	/** The URL or magnet link of the file to download. */
	url: string;
	/** The type of download (HTTP or torrent). */
	type: "http" | "torrent";
	/** Optional: The desired name for the downloaded file. */
	name?: string;
	/** Optional: The destination directory for the downloaded file. */
	path?: string;
	/** Optional: Priority level for the download. */
	priority?: DownloadPriority;
	/** Optional: Game metadata associated with the download. */
	game_data?: DownloadgameData;
	/** Optional: Whether to start the download automatically after adding it. */
	autoStart?: boolean;
}

/**
 * Interface for download progress updates.
 */
export interface DownloadProgress {
	/** Unique identifier of the download. */
	id: string;
	/** Current progress percentage (0-100). */
	progress: number;
	/** Current download speed in bytes/sec. */
	speed: number;
	/** Estimated time remaining for the download in seconds. */
	timeRemaining: number;
	/** Current status of the download. */
	status: DownloadStatus;
	/** Optional: Error message if the download failed. */
	error?: string;
	/** Optional: The name of the file currently being processed during unzipping/unraring. */
	currentFile?: string;
}

/**
 * Interface for download state change events.
 */
export interface DownloadStateChange {
	/** Unique identifier of the download. */
	id: string;
	/** The status of the download before the change. */
	previousStatus: DownloadStatus;
	/** The current status of the download after the change. */
	currentStatus: DownloadStatus;
	/** Timestamp of when the status change occurred. */
	timestamp: Date;
}

/**
 * Interface for download error information.
 */
export interface DownloadError {
	/** Unique identifier of the download. */
	id: string;
	/** Description of the error. */
	error: string;
	/** The status of the download when the error occurred. */
	status: DownloadStatus;
	/** Timestamp of when the error occurred. */
	timestamp: Date;
}
