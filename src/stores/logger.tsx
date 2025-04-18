import { LogEntry, LoggerFilterOptions } from "@/@types/logs";
import { invoke } from "@/lib";
import { create } from "zustand";

interface LoggerState {
  logs: LogEntry[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  fetchLogs: () => Promise<void>;
  clear: () => Promise<void>;
  log: (level: LogEntry["level"], message: string) => Promise<void>;
  getLog: (timestamp: number) => Promise<LogEntry | null>;
  filter: (options: LoggerFilterOptions) => Promise<LogEntry[]>;
  getLoggedDates: (includeTime?: boolean) => Promise<string[]>;
  clearError: () => void;
}

export const useLoggerStore = create<LoggerState>((set, get) => ({
  logs: [],
  loading: false,
  error: null,
  lastUpdated: null,

  clearError: () => set({ error: null }),

  fetchLogs: async () => {
    const lastUpdated = get().lastUpdated;
    const now = Date.now();
    
    // Only fetch if data is stale (older than 1 minute)
    if (lastUpdated && now - lastUpdated < 60000) {
      return;
    }

    set({ loading: true, error: null });
    try {
      const logs = await window.ipcRenderer.invoke("logger:get-all");
      if (!logs) {
        throw new Error("No logs found");
      }
      set({ logs, lastUpdated: now });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error fetching logs:", error);
      set({ error: errorMessage });
    } finally {
      set({ loading: false });
    }
  },

  clear: async () => {
    set({ loading: true, error: null });
    try {
      await window.ipcRenderer.invoke("logger:clear");
      set({ logs: [] });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error clearing logs:", error);
      set({ error: errorMessage });
    } finally {
      set({ loading: false });
    }
  },

  deleteLog: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await window.ipcRenderer.invoke("logger:delete", id);
      // Re-fetch logs after deletion to keep state in sync
      const logs = await window.ipcRenderer.invoke("logger:get-all-logs");
      set({ logs });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error deleting log:", error);
      set({ error: errorMessage });
    } finally {
      set({ loading: false });
    }
  },

  log: async (level, message) => {
    set({ loading: true, error: null });
    try {
      const log = await window.ipcRenderer.invoke("logger:log", level, message);

      if (!log) return;

      set((state) => ({
        logs: [...state.logs, log],
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error adding log:", error);
      set({ error: errorMessage });
    } finally {
      set({ loading: false });
    }
  },

  getLog: async (id: number) => {
    set({ error: null });
    try {
      return await window.ipcRenderer.invoke("logger:get-log", id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error fetching log:", error);
      set({ error: errorMessage });
      return null;
    }
  },

  filter: async (options: LoggerFilterOptions): Promise<LogEntry[]> => {
    set({ loading: true, error: null });
    try {
      const filteredLogs = await invoke<LogEntry[], LoggerFilterOptions>(
        "logger:filter",
        options
      );
      return filteredLogs ?? [];
    } catch (err) {
      set({ error: String(err) });
      console.error("Error filtering logs:", err);
      return [];
    } finally {
      set({ loading: false });
    }
  },

  getLoggedDates: async (includeTime = false): Promise<string[]> => {
    set({ loading: true, error: null });
    try {
      const dates = await invoke<string[], boolean>(
        "logger:get-logged-dates",
        includeTime
      );
      return dates ?? [];
    } catch (err) {
      set({ error: String(err) });
      console.error("Error fetching logged dates:", err);
      return [];
    } finally {
      set({ loading: false });
    }
  },
}));
