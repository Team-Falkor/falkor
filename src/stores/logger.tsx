import { LogEntry } from "@/@types/logs";
import { create } from "zustand";

interface LoggerState {
  logs: LogEntry[];
  loading: boolean;
  error: string | null;
  fetchLogs: () => Promise<void>;
  clear: () => Promise<void>;
  log: (level: LogEntry["level"], message: string) => Promise<void>;
  getLog: (timestamp: number) => Promise<LogEntry | null>;
}

export const useLoggerStore = create<LoggerState>((set) => ({
  logs: [],
  loading: false,
  error: null,

  fetchLogs: async () => {
    set({ loading: true, error: null });
    try {
      const logs = await window.ipcRenderer.invoke("logger:get-all");
      set({ logs });
    } catch (err) {
      set({ error: String(err) });
      console.error("Error fetching logs:", err);
    } finally {
      set({ loading: false });
    }
  },

  clear: async () => {
    set({ loading: true, error: null });
    try {
      await window.ipcRenderer.invoke("logger:clear");
      set({ logs: [] });
    } catch (err) {
      set({ error: String(err) });
      console.error("Error clearing logs:", err);
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
    } catch (err) {
      set({ error: String(err) });
      console.error("Error deleting log:", err);
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
    } catch (err) {
      set({ error: String(err) });
      console.error("Error adding log:", err);
    } finally {
      set({ loading: false });
    }
  },

  getLog: async (id: number) => {
    set({ error: null });
    try {
      return await window.ipcRenderer.invoke("logger:get-log", id);
    } catch (err) {
      set({ error: String(err) });
      console.error("Error fetching log:", err);
      return null;
    }
  },
}));
