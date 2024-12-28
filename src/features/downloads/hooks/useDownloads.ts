import { useDownloadStore } from "@/stores/downloads";
import { useEffect } from "react";

interface UseDownloadsProps {
  fetch: boolean;
  forceFetch: boolean;
}

const UseDownloads = ({
  fetch = true,
  forceFetch = false,
}: Partial<UseDownloadsProps> = {}) => {
  const {
    addToQueue,
    downloads,
    fetchDownloads,
    fetchQueue,
    maxConcurrentDownloads,
    pauseDownload,
    queue,
    removeFromQueue,
    resumeDownload,
    stopDownload,
    updateMaxConcurrentDownloads,
  } = useDownloadStore();

  useEffect(() => {
    if (!fetch && !forceFetch) return;

    if (!forceFetch && queue?.length === 0) {
      fetchQueue();
    }

    if (!forceFetch && downloads?.length === 0) {
      fetchDownloads();
    }

    if (forceFetch) {
      fetchQueue();
      fetchDownloads();
    }
  }, [
    fetch,
    forceFetch,
    queue?.length,
    downloads?.length,
    fetchQueue,
    fetchDownloads,
  ]);

  return {
    addDownload: addToQueue,
    downloads,
    fetchDownloads,
    fetchQueue,
    maxConcurrentDownloads,
    pauseDownload,
    queue,
    removeFromQueue,
    resumeDownload,
    stopDownload,
    updateMaxConcurrentDownloads,
  };
};

export default UseDownloads;
