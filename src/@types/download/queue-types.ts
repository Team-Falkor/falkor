import { DownloadgameData, DownloadStatus } from './types';

/**
 * Common interface for download manager resources
 */
export interface DownloadResource {
  id: string;
  status: DownloadStatus;
  progress: number;
  downloadSpeed: number;
  timeRemaining?: number | 'completed';
  totalSize?: number;
  path?: string;
  game_data?: DownloadgameData;
}

/**
 * Enhanced download state with additional properties for tracking
 */
export interface DownloadState {
  id: string;
  url?: string;
  filename?: string;
  game_data?: DownloadgameData;
  path?: string;
  downloadSpeed: number;
  progress: number;
  totalSize?: number;
  status: DownloadStatus;
  timeRemaining?: number | 'completed';
  uploadSpeed?: number;
  numPeers?: number;
  error?: string;
  retryCount?: number;
  lastUpdated?: number;
}

/**
 * Configuration for download retry behavior
 */
export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  shouldRetry: (error: Error) => boolean;
}

/**
 * Events emitted by the download queue
 */
export enum DownloadQueueEvent {
  DOWNLOAD_ADDED = 'download:added',
  DOWNLOAD_REMOVED = 'download:removed',
  DOWNLOAD_STARTED = 'download:started',
  DOWNLOAD_COMPLETED = 'download:completed',
  DOWNLOAD_FAILED = 'download:failed',
  DOWNLOAD_PAUSED = 'download:paused',
  DOWNLOAD_RESUMED = 'download:resumed',
  DOWNLOAD_STOPPED = 'download:stopped',
  DOWNLOAD_PROGRESS = 'download:progress',
  DOWNLOAD_ERROR = 'download:error',
  DOWNLOAD_RETRY = 'download:retry',
  TORRENT_ADDED = 'torrent:added',
  TORRENT_REMOVED = 'torrent:removed',
  TORRENT_STARTED = 'torrent:started',
  TORRENT_COMPLETED = 'torrent:completed',
  TORRENT_FAILED = 'torrent:failed',
  TORRENT_PAUSED = 'torrent:paused',
  TORRENT_RESUMED = 'torrent:resumed',
  TORRENT_STOPPED = 'torrent:stopped',
  TORRENT_PROGRESS = 'torrent:progress',
  TORRENT_ERROR = 'torrent:error',
  TORRENT_RETRY = 'torrent:retry',
  QUEUE_CLEARED = 'queue:cleared'
}

/**
 * Options for the download queue
 */
export interface DownloadQueueOptions {
  maxConcurrentDownloads?: number;
  throttleInterval?: number;
  retryConfig?: Partial<RetryConfig>;
}