import { DownloadItem, DownloadPriority, DownloadStatus } from "@/@types";
import { invoke } from "@/lib";
import { create } from "zustand";

type DownloadsState = {
  downloads: DownloadItem[];
  isLoading: boolean;
  error: string | null;
  // Actions
  fetchDownloads: () => Promise<void>;
  addDownload: (options: {
    url: string;
    type: "http" | "torrent";
    path: string;
    name?: string;
  }) => Promise<DownloadItem | null>;
  pauseDownload: (id: string) => Promise<boolean>;
  resumeDownload: (id: string) => Promise<boolean>;
  cancelDownload: (id: string) => Promise<boolean>;
  removeDownload: (id: string) => Promise<boolean>;
  clearCompletedDownloads: () => Promise<boolean>;
  setPriority: (id: string, priority: DownloadPriority) => Promise<boolean>;
  throttleDownload: (speed: number) => Promise<boolean>;
  throttleUpload: (speed: number) => Promise<boolean>;
};

export const useDownloadsStore = create<DownloadsState>((set) => ({
  downloads: [],
  isLoading: false,
  error: null,

  fetchDownloads: async () => {
    try {
      set({ isLoading: true, error: null });
      const downloads = await window.ipcRenderer.invoke(
        "download-queue:get-all"
      );
      set({ downloads, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addDownload: async (options) => {
    try {
      set({ error: null });
      // Ensure autoStart is explicitly set to true to fix the download not starting bug
      // The backend returns a string ID, not a DownloadItem
      const downloadId = await invoke<string>("download-queue:add", {
        ...options,
        autoStart: true,
      });
      if (downloadId) {
        // Create a temporary download item with the ID and basic info
        // The full details will be updated via the event listeners
        const newDownload: DownloadItem = {
          id: downloadId,
          url: options.url,
          type: options.type,
          name: options.name || `Download-${downloadId.substring(0, 8)}`,
          path: options.path || "",
          status: DownloadStatus.QUEUED,
          progress: 0,
          speed: 0,
          size: 0,
          timeRemaining: 0,
          paused: false,
          created: new Date(),
        };
        set((state) => ({
          downloads: [...state.downloads, newDownload],
        }));
        return newDownload;
      }
      return null;
    } catch (error) {
      set({ error: (error as Error).message });
      return null;
    }
  },

  pauseDownload: async (id) => {
    try {
      set({ error: null });
      // First, ensure we have the download in our state before pausing
      const currentState = useDownloadsStore.getState();
      const downloadToUpdate = currentState.downloads.find(
        (download) => download.id === id
      );

      if (!downloadToUpdate) {
        console.error(`Download with ID ${id} not found in store`);
        return false;
      }

      // Call the backend to pause the download
      const success = await window.ipcRenderer.invoke(
        "download-queue:pause",
        id
      );

      if (success) {
        // Update the download status in our store
        set((state) => ({
          downloads: state.downloads.map((download) =>
            download.id === id
              ? {
                  ...download,
                  status: DownloadStatus.PAUSED,
                  paused: true,
                }
              : download
          ),
        }));

        // Verify the download is still in the store with paused status
        setTimeout(() => {
          const updatedState = useDownloadsStore.getState();
          const pausedDownloadExists = updatedState.downloads.some(
            (download) =>
              download.id === id && download.status === DownloadStatus.PAUSED
          );

          if (!pausedDownloadExists) {
            console.warn(
              `Paused download ${id} not found in store, restoring it`
            );
            // If the download was somehow removed, add it back with paused status
            set((state) => ({
              downloads: [
                ...state.downloads,
                {
                  ...downloadToUpdate,
                  status: DownloadStatus.PAUSED,
                  paused: true,
                },
              ],
            }));
          }
        }, 100); // Small delay to ensure state updates have propagated
      }
      return success;
    } catch (error) {
      console.error(`Error pausing download: ${(error as Error).message}`);
      set({ error: (error as Error).message });
      return false;
    }
  },

  resumeDownload: async (id) => {
    try {
      set({ error: null });
      const success = await window.ipcRenderer.invoke(
        "download-queue:resume",
        id
      );
      if (success) {
        set((state) => ({
          downloads: state.downloads.map((download) =>
            download.id === id
              ? {
                  ...download,
                  status: DownloadStatus.DOWNLOADING,
                  paused: false,
                }
              : download
          ),
        }));
      }
      return success;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    }
  },

  cancelDownload: async (id) => {
    try {
      set({ error: null });
      const success = await window.ipcRenderer.invoke(
        "download-queue:cancel",
        id
      );
      if (success) {
        set((state) => ({
          downloads: state.downloads.map((download) =>
            download.id === id
              ? { ...download, status: DownloadStatus.CANCELLED }
              : download
          ),
        }));
      }
      return success;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    }
  },

  removeDownload: async (id) => {
    try {
      set({ error: null });
      const success = await window.ipcRenderer.invoke(
        "download-queue:remove",
        id
      );
      if (success) {
        set((state) => ({
          downloads: state.downloads.filter((download) => download.id !== id),
        }));
      }
      return success;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    }
  },

  clearCompletedDownloads: async () => {
    try {
      set({ error: null });
      const success = await window.ipcRenderer.invoke(
        "download-queue:clear-completed"
      );
      if (success) {
        set((state) => ({
          downloads: state.downloads.filter(
            (download) => download.status !== DownloadStatus.COMPLETED
          ),
        }));
      }
      return success;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    }
  },

  setPriority: async (id, priority) => {
    try {
      set({ error: null });
      const success = await window.ipcRenderer.invoke(
        "download-queue:set-priority",
        id,
        priority
      );
      return success;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    }
  },

  throttleDownload: async (speed) => {
    try {
      set({ error: null });
      const success = await window.ipcRenderer.invoke(
        "torrent:throttle-download",
        speed
      );
      return success;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    }
  },

  throttleUpload: async (speed) => {
    try {
      set({ error: null });
      const success = await window.ipcRenderer.invoke(
        "torrent:throttle-upload",
        speed
      );
      return success;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    }
  },
}));

// Setup event listeners for real-time updates
if (typeof window !== "undefined") {
  window.ipcRenderer?.on("download-queue:progress", (_, progress) => {
    useDownloadsStore.setState((state) => ({
      downloads: state.downloads.map((download) =>
        download.id === progress.id ? { ...download, ...progress } : download
      ),
    }));
  });

  window.ipcRenderer?.on("download-queue:state-change", (_, stateChange) => {
    useDownloadsStore.setState((state) => {
      // Make sure we don't lose paused downloads during state changes
      if (stateChange.currentStatus === DownloadStatus.PAUSED) {
        console.log(
          `Download ${stateChange.id} paused, ensuring it stays in the UI`
        );
      }

      return {
        downloads: state.downloads.map((download) =>
          download.id === stateChange.id
            ? {
                ...download,
                status: stateChange.currentStatus,
                paused: stateChange.currentStatus === DownloadStatus.PAUSED,
                ...stateChange,
              }
            : download
        ),
      };
    });
  });

  window.ipcRenderer?.on("download-queue:error", (_, error) => {
    useDownloadsStore.setState((state) => ({
      downloads: state.downloads.map((download) =>
        download.id === error.id
          ? { ...download, status: DownloadStatus.FAILED, error: error.message }
          : download
      ),
    }));
  });
}
