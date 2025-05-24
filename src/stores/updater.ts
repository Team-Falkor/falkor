import { create } from "zustand";
import type { UpdateInfoWithReleaseNotes } from "@/@types";

/**
 * Invoke an IPC renderer method and return the result as `T` or `null`
 * if the invocation fails.
 * @param channel The IPC channel to invoke.
 * @param args The arguments to pass to the invoked method.
 * @returns The result of the invocation as `T` or `null`.
 */
export const invoke = async <T, A extends unknown[] = unknown[]>(
	channel: string,
	...args: A[]
): Promise<T | null> => {
	try {
		return await window.ipcRenderer.invoke(channel, ...args);
	} catch (error) {
		console.error(error);
		return null;
	}
};

interface UpdaterState {
	updateAvailable: boolean;
	updateInfo?: UpdateInfoWithReleaseNotes;
	progress?: number;
	checkForUpdates: () => void;
	installUpdate: () => void;
	setUpdateAvailable: (updateAvailable: boolean) => void;
	setUpdateInfo: (updateInfo: UpdateInfoWithReleaseNotes) => void;
	changelog?: string;
}

export const useUpdaterStore = create<UpdaterState>((set) => ({
	updateAvailable: false,
	progress: 0,
	updateInfo: undefined,

	setUpdateInfo: (updateInfo: UpdateInfoWithReleaseNotes) => {
		set(() => ({ updateInfo }));
	},

	checkForUpdates: async () => {
		const check = await invoke<
			{
				success: boolean;
				data?: boolean | null;
				error?: string;
			},
			never
		>("updater:check-for-update");
		if (!check || !check.success) return;

		window.ipcRenderer.on("updater:download-progress", (_, progress) => {
			if (!progress)
				window.ipcRenderer.removeAllListeners("updater:download-progress");
			set(() => ({ progress }));
		});

		set(() => ({ updateAvailable: check.data ?? false }));
	},
	installUpdate: () => {
		const install = invoke("updater:install");
		if (!install) return;

		set(() => ({ updateAvailable: false }));
	},
	setUpdateAvailable: (updateAvailable: boolean) => {
		set(() => ({ updateAvailable }));
	},
}));
