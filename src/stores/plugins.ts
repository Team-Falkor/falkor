import { create } from "zustand";

interface PluginsState {
	enabledOnly: boolean;
	toggleEnabledOnly: () => void;
	setEnabledOnly: (enabled: boolean) => void;
}

export const usePluginsStore = create<PluginsState>((set, get) => ({
	enabledOnly: localStorage.getItem("showEnabledOnly") === "true",

	toggleEnabledOnly: () => {
		const current = get().enabledOnly;
		const newValue = !current;
		localStorage.setItem("showEnabledOnly", String(newValue));
		set({ enabledOnly: newValue });
	},

	setEnabledOnly: (enabled: boolean) => {
		localStorage.setItem("showEnabledOnly", String(enabled));
		set({ enabledOnly: enabled });
	},
}));
