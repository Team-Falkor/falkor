import { useEffect } from "react";
import { useUpdaterStore } from "@/stores/updater";

/**
 * A hook to interact with the application's update system.
 * It provides the current update status, progress, and available actions.
 *
 * This hook is a thin wrapper around the `useUpdaterStore` and is the
 * recommended way for components to access updater state.
 */
export const useUpdater = () => {
	const {
		status,
		updateInfo,
		progress,
		initialize,
		checkForUpdates,
		downloadUpdate,
		installUpdate,
	} = useUpdaterStore();

	useEffect(() => {
		initialize();
		checkForUpdates();
	}, [initialize, checkForUpdates]);

	useEffect(() => {
		console.log(updateInfo);
	}, [updateInfo]);

	return {
		status,
		updateInfo,
		progress,
		checkForUpdates,
		downloadUpdate,
		installUpdate,
	};
};
