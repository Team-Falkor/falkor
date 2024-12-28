import { DownloadData, QueueData } from "@/@types";
import { ITorrent } from "@/@types/torrent";
import { create } from "zustand";

interface QueueStoreState {
  queue: QueueData[];
  downloads: Array<DownloadData | ITorrent>;
  maxConcurrentDownloads: number;
  addToQueue: (item: QueueData) => Promise<void>;
  removeFromQueue: (id: string) => Promise<void>;
  fetchQueue: () => Promise<void>;
  fetchDownloads: () => Promise<void>;
  pauseDownload: (id: string) => Promise<void>;
  resumeDownload: (id: string) => Promise<void>;
  stopDownload: (id: string) => Promise<void>;
  updateMaxConcurrentDownloads: (max: number) => Promise<void>;
}

export const useDownloadStore = create<QueueStoreState>((set, get) => {
  const logError = (action: string, error: unknown) => {
    console.error(`[DownloadStore] ${action} failed:`, error);
  };

  const safeSetState = <T extends keyof QueueStoreState>(
    key: T,
    value: QueueStoreState[T]
  ) => {
    set((state) => ({
      ...state,
      [key]: value,
    }));
  };

  return {
    queue: [],
    downloads: [],
    maxConcurrentDownloads: 1,

    fetchQueue: async () => {
      try {
        const response = await window.ipcRenderer.invoke("queue:getQueueItems");
        if (response.success) {
          safeSetState("queue", response.data);
        } else {
          logError("Fetching queue", response.error);
        }
      } catch (error) {
        logError("Fetching queue", error);
      }
    },

    fetchDownloads: async () => {
      try {
        const response = await window.ipcRenderer.invoke("queue:getDownloads");
        if (response.success) {
          safeSetState("downloads", response.data);
        } else {
          logError("Fetching downloads", response.error);
        }
      } catch (error) {
        logError("Fetching downloads", error);
      }
    },

    addToQueue: async (item: QueueData) => {
      try {
        const response = await window.ipcRenderer.invoke("queue:add", item);
        if (response.success) {
          Promise.all([await get().fetchDownloads(), await get().fetchQueue()]);
        } else {
          logError("Adding to queue", response.error);
        }
      } catch (error) {
        logError("Adding to queue", error);
      }
    },

    removeFromQueue: async (id: string) => {
      try {
        const response = await window.ipcRenderer.invoke("queue:remove", id);
        if (response.success) {
          await get().fetchQueue();
        } else {
          logError("Removing from queue", response.error);
        }
      } catch (error) {
        logError("Removing from queue", error);
      }
    },

    pauseDownload: async (id: string) => {
      try {
        const response = await window.ipcRenderer.invoke("queue:pause", id);
        if (response.success) {
          await get().fetchDownloads();
        } else {
          logError("Pausing download", response.error);
        }
      } catch (error) {
        logError("Pausing download", error);
      }
    },

    resumeDownload: async (id: string) => {
      try {
        const response = await window.ipcRenderer.invoke("queue:resume", id);
        if (response.success) {
          await get().fetchDownloads();
        } else {
          logError("Resuming download", response.error);
        }
      } catch (error) {
        logError("Resuming download", error);
      }
    },

    stopDownload: async (id: string) => {
      try {
        const response = await window.ipcRenderer.invoke("queue:stop", id);
        if (response.success) {
          await get().fetchDownloads();
        } else {
          logError("Stopping download", response.error);
        }
      } catch (error) {
        logError("Stopping download", error);
      }
    },

    updateMaxConcurrentDownloads: async (max: number) => {
      try {
        safeSetState("maxConcurrentDownloads", max);
        const response = await window.ipcRenderer.invoke(
          "queue:updateMaxConcurrentDownloads",
          max
        );
        if (!response.success) {
          logError("Updating max concurrent downloads", response.error);
        }
      } catch (error) {
        logError("Updating max concurrent downloads", error);
      }
    },
  };
});
