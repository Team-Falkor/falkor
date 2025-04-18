import { DownloadStatus } from "@/@types";
import { useDownloadsStore } from "@/stores/downloads";

/**
 * Hook to get download statistics
 * Returns counts of downloads by status
 */
export function useDownloadStats() {
  const { downloads } = useDownloadsStore();

  const activeCount = downloads.filter(
    (d) => d.status === DownloadStatus.DOWNLOADING
  ).length;
  const queuedCount = downloads.filter(
    (d) => d.status === DownloadStatus.QUEUED
  ).length;
  const pausedCount = downloads.filter(
    (d) => d.status === DownloadStatus.PAUSED
  ).length;
  const completedCount = downloads.filter(
    (d) => d.status === DownloadStatus.COMPLETED
  ).length;
  const failedCount = downloads.filter(
    (d) => d.status === DownloadStatus.FAILED
  ).length;

  const totalCount = downloads.length;
  const hasDownloads = totalCount > 0;
  const hasActiveDownloads = activeCount > 0;

  return {
    activeCount,
    queuedCount,
    pausedCount,
    completedCount,
    failedCount,
    totalCount,
    hasDownloads,
    hasActiveDownloads,
  };
}
