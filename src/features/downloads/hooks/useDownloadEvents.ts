import { DownloadItem, DownloadStatus } from "@/@types";
import { useDownloadsStore } from "@/stores/downloads";
import { useState, useEffect } from "react";

/**
 * Hook to manage download queue events from the backend
 * Listens for progress updates, completion, errors, and state changes
 */
export function useDownloadEvents() {
  const { downloads, fetchDownloads } = useDownloadsStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initial fetch of downloads
    if (!isInitialized) {
      fetchDownloads();
      setIsInitialized(true);
    }

    // Set up event listeners for download events
    const progressHandler = (_: unknown, download: DownloadItem) => {
      useDownloadsStore.setState((state) => ({
        downloads: state.downloads.map((item) =>
          item.id === download.id ? { ...item, ...download } : item
        ),
      }));
    };

    const completeHandler = (_: unknown, download: DownloadItem) => {
      useDownloadsStore.setState((state) => ({
        downloads: state.downloads.map((item) =>
          item.id === download.id
            ? { ...item, ...download, status: DownloadStatus.COMPLETED }
            : item
        ),
      }));
    };

    const errorHandler = (_: unknown, download: DownloadItem) => {
      useDownloadsStore.setState((state) => ({
        downloads: state.downloads.map((item) =>
          item.id === download.id
            ? { ...item, ...download, status: DownloadStatus.FAILED }
            : item
        ),
      }));
    };

    const stateChangeHandler = (_: unknown, download: DownloadItem) => {
      useDownloadsStore.setState((state) => ({
        downloads: state.downloads.map((item) =>
          item.id === download.id ? { ...item, ...download } : item
        ),
      }));
    };

    // Register event listeners
    window.ipcRenderer.on("download-queue:progress", progressHandler);
    window.ipcRenderer.on("download-queue:complete", completeHandler);
    window.ipcRenderer.on("download-queue:error", errorHandler);
    window.ipcRenderer.on("download-queue:state-change", stateChangeHandler);

    // Cleanup function
    return () => {
      window.ipcRenderer.removeListener(
        "download-queue:progress",
        progressHandler
      );
      window.ipcRenderer.removeListener(
        "download-queue:complete",
        completeHandler
      );
      window.ipcRenderer.removeListener("download-queue:error", errorHandler);
      window.ipcRenderer.removeListener(
        "download-queue:state-change",
        stateChangeHandler
      );
    };
  }, [fetchDownloads, isInitialized]);

  return { downloads };
}
