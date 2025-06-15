import { create } from "zustand";
import { type UpdateInfoWithReleaseNotes, UpdateStatus } from "@/@types";

export const invoke = async <T, A extends unknown[] = unknown[]>(
	channel: string,
	...args: A
): Promise<T | null> => {
	try {
		return await window.ipcRenderer.invoke(channel, ...args);
	} catch (error) {
		console.error(`[IPC] Error invoking '${channel}':`, error);
		return null;
	}
};

interface UpdaterState {
	status: UpdateStatus;
	updateInfo: UpdateInfoWithReleaseNotes | null;
	progress: number;
	initialize: () => void;
	checkForUpdates: () => void;
	downloadUpdate: () => void;
	installUpdate: () => void;
}

export const useUpdaterStore = create<UpdaterState>((set) => ({
	status: UpdateStatus.IDLE,
	updateInfo: null,
	progress: 0,

	initialize: async () => {
		const result = await invoke<{ status: UpdateStatus }>("updater:get-status");
		console.log(result);
		if (result) {
			set({ status: result.status });
			if (
				result.status === "UPDATE_AVAILABLE" ||
				result.status === "DOWNLOADED"
			) {
				const info = await invoke<UpdateInfoWithReleaseNotes>(
					"updater:get-update-info",
				);
				if (info) {
					set({ updateInfo: info });
				}
			}
		}
	},

	checkForUpdates: () => {
		invoke("updater:check-for-update");
	},

	downloadUpdate: () => {
		invoke("updater:download-update");
	},

	installUpdate: () => {
		invoke("updater:install-update");
	},
}));

const { setState } = useUpdaterStore;

window.ipcRenderer.on("updater:status-changed", (_, status: UpdateStatus) => {
	console.log("[Updater] Status changed to:", status);
	setState({ status });

	if (status !== "DOWNLOADING") {
		setState({ progress: 0 });
	}
});

window.ipcRenderer.on(
	"updater:update-available",
	(_, info: UpdateInfoWithReleaseNotes) => {
		console.log("[Updater] Update available:", info);
		setState({ updateInfo: info });
	},
);

window.ipcRenderer.on("updater:download-progress", (_, progress: number) => {
	setState({ progress });
});

window.ipcRenderer.on("updater:error", (_, error: string) => {
	console.error("[Updater] Received error:", error);
});
