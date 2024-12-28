import { SettingsConfig } from "@/@types";
import { invoke } from "@/lib";
import { toast } from "sonner";
import { create } from "zustand";

interface SettingsStoreState {
  settings: SettingsConfig;
  loading: boolean;
  error: string | null;
  hasDoneFirstFetch: boolean;
  fetchSettings: () => Promise<void>;
  updateSetting: <K extends keyof SettingsConfig>(
    key: K,
    value: SettingsConfig[K]
  ) => Promise<void>;
  resetSettings: () => Promise<void>;
  reloadSettings: () => Promise<void>;
  setHasDoneFirstFetch: () => void;
}

export const useSettingsStore = create<SettingsStoreState>((set) => ({
  settings: {} as SettingsConfig, // Initial empty object for settings
  loading: false,
  error: null,
  hasDoneFirstFetch: false,

  setHasDoneFirstFetch: () => {
    set({ hasDoneFirstFetch: true });
  },

  // Fetch settings from backend including defaults
  fetchSettings: async () => {
    set({ loading: true, error: null });
    try {
      const settings = await invoke<SettingsConfig>("settings:get-all");
      if (!settings) {
        console.error("Error fetching settings: No settings returned");
        set({ error: "Error fetching settings: No settings returned" });
        return;
      }
      set({ settings });
    } catch (err) {
      set({ error: `Error fetching settings: ${String(err)}` });
      console.error("Error fetching settings:", err);
    } finally {
      set({ loading: false });
    }
  },

  // Update a specific setting
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

      console.log("Success:", success);
      toast.success(`Setting "${key}" updated successfully!`);

      if (success !== null) {
        set((state) => ({
          settings: { ...state.settings, [key]: value },
        }));
      }
    } catch (err) {
      set({ error: `Error updating setting "${key}": ${String(err)}` });
      console.error(`Error updating setting "${key}":`, err);
      toast.error(`Error updating setting "${key}": ${String(err)}`);
    } finally {
      set({ loading: false });
    }
  },

  // Reset to backend-defined defaults
  resetSettings: async () => {
    set({ loading: true, error: null });
    try {
      const resetSettings = await invoke<SettingsConfig | null>(
        "settings:reset-to-default"
      );
      if (resetSettings) {
        set({ settings: resetSettings });
      }
    } catch (err) {
      set({ error: `Error resetting settings: ${String(err)}` });
      console.error("Error resetting settings:", err);
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
