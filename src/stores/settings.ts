import { SettingsConfig } from "@/@types";
import { invoke } from "@/lib";
import { toast } from "sonner";
import { create } from "zustand";

interface SettingsStoreState {
  settings: SettingsConfig;
  loading: boolean;
  error: string | null;
  hasDoneFirstFetch: boolean;
  lastUpdated: number | null;
  fetchSettings: () => Promise<void>;
  updateSetting: <K extends keyof SettingsConfig>(
    key: K,
    value: SettingsConfig[K]
  ) => Promise<void>;
  resetSettings: () => Promise<void>;
  reloadSettings: () => Promise<void>;
  setHasDoneFirstFetch: () => void;
}

export const useSettingsStore = create<SettingsStoreState>(( set, get) => ({
  settings: {} as SettingsConfig,
  loading: false,
  error: null,
  hasDoneFirstFetch: false,
  lastUpdated: null as number | null,

  setHasDoneFirstFetch: () => {
    set({ hasDoneFirstFetch: true });
  },

  fetchSettings: async () => {
    const state = get();
    const now = Date.now();

    // Only fetch if data is stale (older than 5 minutes)
    if (state.lastUpdated && now - state.lastUpdated < 300000) {
      return;
    }

    set({ loading: true, error: null });
    try {
      const settings = await invoke<SettingsConfig>("settings:get-all");
      if (!settings) {
        throw new Error("No settings returned from backend");
      }
      set({ settings, lastUpdated: now });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error fetching settings:", error);
      set({ error: errorMessage });
    } finally {
      set({ loading: false });
    }
  },

  updateSetting: async <K extends keyof SettingsConfig>(
    key: K,
    value: SettingsConfig[K]
  ) => {
    set({ loading: true, error: null });
    try {
      const success = await invoke<boolean | null>(
        "settings:update",
        key,
        value
      );

      if (success === null) {
        throw new Error(`Failed to update setting "${key}"`); 
      }

      set((state) => ({
        settings: { ...state.settings, [key]: value },
        lastUpdated: Date.now()
      }));

      toast.success(`Setting "${key}" updated successfully!`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error updating setting "${key}":`, error);
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  resetSettings: async () => {
    set({ loading: true, error: null });
    try {
      const resetSettings = await invoke<SettingsConfig | null>(
        "settings:reset-to-default"
      );
      if (!resetSettings) {
        throw new Error("Failed to reset settings to default");
      }
      set({ 
        settings: resetSettings,
        lastUpdated: Date.now()
      });
      toast.success("Settings reset to default values");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error resetting settings:", error);
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  // Reload settings from backend JSON
  reloadSettings: async () => {
    set({ loading: true, error: null });
    try {
      const reloadedSettings = await invoke<SettingsConfig | null>(
        "settings:reload"
      );
      if (reloadedSettings) {
        set({ settings: reloadedSettings });
      }
    } catch (err) {
      set({ error: `Error reloading settings: ${String(err)}` });
      console.error("Error reloading settings:", err);
    } finally {
      set({ loading: false });
    }
  },
}));
