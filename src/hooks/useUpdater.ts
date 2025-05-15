import { useEffect } from "react";
import type { UpdateInfoWithReleaseNotes } from "@/@types";
import { useUpdaterStore } from "@/stores/updater";

export const useUpdater = () => {
	const {
		updateAvailable,
		checkForUpdates,
		installUpdate,
		progress,
		setUpdateAvailable,
		setUpdateInfo,
		updateInfo,
	} = useUpdaterStore();
	useEffect(() => {
		checkForUpdates();
	}, [checkForUpdates]);

	useEffect(() => {
		window.ipcRenderer.once(
			"updater:update-available",
			(_event, info: UpdateInfoWithReleaseNotes) => {
				setUpdateAvailable(true);
				setUpdateInfo(info);
				window.ipcRenderer.removeAllListeners("updater:update-available");
			},
		);
		return () => {
			window.ipcRenderer.removeAllListeners("updater:update-available");
		};
	}, [setUpdateAvailable, setUpdateInfo]);

	return {
		updateAvailable,
		checkForUpdates,
		installUpdate,
		progress,
		updateInfo,
		setUpdateAvailable,
		setUpdateInfo,
	};
};
