import type { UpdateInfo } from "electron-updater";

export type UpdateInfoWithReleaseNotes = UpdateInfo & {
	releaseNotes: string;
};

// A state machine is much more robust for tracking the update process.
export enum UpdateStatus {
	IDLE = "IDLE", // Not doing anything
	CHECKING = "CHECKING", // Checking for an update
	UPDATE_AVAILABLE = "UPDATE_AVAILABLE", // An update is available (but not downloaded)
	DOWNLOADING = "DOWNLOADING", // Update is downloading
	DOWNLOADED = "DOWNLOADED", // Update is ready to be installed
	ERROR = "ERROR", // An error occurred
}
