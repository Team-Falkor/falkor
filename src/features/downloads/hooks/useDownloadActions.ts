import { useDownloadsStore } from "@/stores/downloads";

/**
 * Hook to manage download actions
 * Provides functions to add, pause, resume, cancel, and remove downloads
 */
export function useDownloadActions() {
  const {
    addDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    removeDownload,
    clearCompletedDownloads,
    setPriority,
    throttleDownload,
    throttleUpload,
  } = useDownloadsStore();

  return {
    addDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    removeDownload,
    clearCompletedDownloads,
    setPriority,
    throttleDownload,
    throttleUpload,
  };
}
