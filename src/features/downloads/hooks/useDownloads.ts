import { useDownloadStore } from "@/stores/downloads";
import { useEffect, useCallback } from "react";
import { DownloadData } from "@/@types";
import { ITorrent } from "@/@types/torrent";

interface UseDownloadsProps {
  fetch: boolean;
  forceFetch: boolean;
}

const UseDownloads = ({
  fetch = true,
  forceFetch = false,
}: Partial<UseDownloadsProps> = {}) => {
  const store = useDownloadStore();

  // Initial fetch effect
  useEffect(() => {
    const fetchData = async () => {
      if (fetch || forceFetch) {
        const promises = [];
        if (forceFetch || !store.queue?.length) {
          promises.push(store.fetchQueue());
        }
        if (forceFetch || !store.downloads?.length) {
          promises.push(store.fetchDownloads());
        }
        await Promise.all(promises);
      }
    };

    void fetchData();
  }, [fetch, forceFetch, store.queue?.length, store.downloads?.length, store.fetchQueue, store.fetchDownloads]);

  return {
    addDownload: store.addToQueue,
    downloads: store.downloads,
    fetchDownloads: store.fetchDownloads,
    fetchQueue: store.fetchQueue,
    maxConcurrentDownloads: store.maxConcurrentDownloads,
    pauseDownload: store.pauseDownload,
    queue: store.queue,
    removeFromQueue: store.removeFromQueue,
    resumeDownload: store.resumeDownload,
    stopDownload: store.stopDownload,
    updateMaxConcurrentDownloads: store.updateMaxConcurrentDownloads,
  };

};

export default UseDownloads;
