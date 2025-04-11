import { PluginSetupJSON } from "@team-falkor/shared-types";
import { create } from "zustand";

interface PluginsState {
  plugins: Map<string, PluginSetupJSON>;
  needsUpdate: Map<string, PluginSetupJSON>;
  loading: boolean;
  error: string | null;
  hasDoneFirstCheck: boolean;
  lastChecked: number | null;

  setHasDoneFirstCheck: () => void;
  setPlugins: (plugins: Array<PluginSetupJSON>) => void;
  setNeedsUpdate: (needsUpdate: Array<PluginSetupJSON>) => void;
  removeNeedsUpdate: (pluginId: string) => void;
  checkForUpdates: (pluginId?: string) => Promise<Array<PluginSetupJSON>>;
  clearError: () => void;
}

export const usePluginsStore = create<PluginsState>((set, get) => ({
  plugins: new Map(),
  needsUpdate: new Map(),
  loading: false,
  error: null,
  hasDoneFirstCheck: false,
  lastChecked: null,
  setHasDoneFirstCheck: () => set({ hasDoneFirstCheck: true }),

  setPlugins: (plugins) => {
    const pluginMap = new Map(plugins.map((plugin) => [plugin.id, plugin]));
    set({ plugins: pluginMap });
  },

  removeNeedsUpdate: (pluginId) => {
    set((state) => {
      state.needsUpdate.delete(pluginId);
      return state;
    });
  },

  setNeedsUpdate: (needsUpdate) => {
    const needsUpdateMap = new Map(
      needsUpdate.map((plugin) => [plugin.id, plugin])
    );
    set({ needsUpdate: needsUpdateMap });
  },

  clearError: () => set({ error: null }),

  checkForUpdates: async (pluginId) => {
    const lastChecked = get().lastChecked;
    const now = Date.now();

    // Only check for updates if last check was more than 1 hour ago
    if (lastChecked && now - lastChecked < 3600000) {
      return [];
    }

    set({ loading: true, error: null });
    try {
      const updatedPlugins = await window.ipcRenderer.invoke(
        "plugins:check-for-updates",
        pluginId
      );

      if (!Array.isArray(updatedPlugins)) {
        throw new Error("Invalid response from plugin update check");
      }

      set(() => ({
        needsUpdate: new Map(
          updatedPlugins.map((plugin) => [plugin.id, plugin])
        ),
        lastChecked: now,
        loading: false,
      }));

      return updatedPlugins;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error checking for updates";
      console.error("Error checking for updates:", error);
      set({ error: errorMessage, loading: false });
      return [];
    }
  },
}));
