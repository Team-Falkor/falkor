/**
 * Utility functions for torrent downloads
 */

import { DownloadItem, DownloadStatus, ITorrent } from "@/@types";
import * as fs from "fs";
import parseTorrent from "parse-torrent";
import * as path from "path";

/**
 * Extract info hash from a magnet link or torrent file
 * @param torrentId Magnet link, torrent file buffer, or info hash
 * @returns The info hash or undefined if extraction fails
 */
export async function extractInfoHash(
  torrentId: string | Buffer
): Promise<string | undefined> {
  try {
    const parsed = await parseTorrent(torrentId);
    return parsed.infoHash;
  } catch (error) {
    console.error("Error parsing torrent:", error);
    return undefined;
  }
}

/**
 * Check if a string is a valid magnet link
 * @param url The URL to check
 * @returns True if the URL is a magnet link
 */
export function isMagnetLink(url: string): boolean {
  return url.startsWith("magnet:");
}

/**
 * Convert a WebTorrent torrent object to the ITorrent interface
 * @param torrent WebTorrent torrent object
 * @returns ITorrent object
 */
export function convertToITorrent(torrent: any): ITorrent {
  return {
    infoHash: torrent.infoHash,
    name: torrent.name,
    progress: torrent.progress * 100,
    downloadSpeed: torrent.downloadSpeed,
    uploadSpeed: torrent.uploadSpeed,
    numPeers: torrent.numPeers,
    path: torrent.path,
    paused: torrent.paused || false,
    status: torrent.done
      ? DownloadStatus.COMPLETED
      : DownloadStatus.DOWNLOADING,
    totalSize: torrent.length,
    timeRemaining: torrent.timeRemaining,
    url: torrent.magnetURI,
  };
}

/**
 * Convert a DownloadItem to the ITorrent interface
 * @param item DownloadItem object
 * @returns ITorrent object
 */
export function downloadItemToITorrent(item: DownloadItem): ITorrent {
  return {
    infoHash: "", // This would need to be populated from the actual torrent
    name: item.name,
    progress: item.progress,
    downloadSpeed: item.speed,
    uploadSpeed: 0, // Not tracked in DownloadItem
    numPeers: 0, // Not tracked in DownloadItem
    path: item.path,
    paused: item.paused,
    status: item.status,
    totalSize: item.size,
    timeRemaining: item.timeRemaining,
    game_data: item.game_data,
    url: item.url,
  };
}

/**
 * Create a unique directory for a torrent
 * @param basePath Base directory path
 * @param torrentName Torrent name
 * @returns Path to the unique directory
 */
export async function createUniqueTorrentDirectory(
  basePath: string,
  torrentName: string
): Promise<string> {
  // Sanitize torrent name for use as directory name
  const sanitizedName = torrentName.replace(/[\\/:*?"<>|]/g, "_");
  const dirPath = path.join(basePath, sanitizedName);

  try {
    // Check if directory exists
    await fs.promises.access(dirPath, fs.constants.F_OK);

    // Directory exists, create a unique name
    const timestamp = Date.now();
    const uniqueDirPath = `${dirPath}-${timestamp}`;
    await fs.promises.mkdir(uniqueDirPath, { recursive: true });
    return uniqueDirPath;
  } catch {
    // Directory doesn't exist, create it
    await fs.promises.mkdir(dirPath, { recursive: true });
    return dirPath;
  }
}

/**
 * Calculate the estimated time remaining for a torrent download
 * @param downloaded Bytes downloaded
 * @param total Total bytes to download
 * @param speed Download speed in bytes per second
 * @returns Estimated time remaining in seconds
 */
export function calculateTimeRemaining(
  downloaded: number,
  total: number,
  speed: number
): number {
  if (speed <= 0 || downloaded >= total) {
    return 0;
  }

  const remainingBytes = total - downloaded;
  return remainingBytes / speed;
}

/**
 * Format time remaining in a human-readable format
 * @param seconds Time in seconds
 * @returns Formatted time string
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds === 0 || !isFinite(seconds)) {
    return "unknown";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}
