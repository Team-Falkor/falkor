import type { UpdateInfo } from "electron-updater";

export type UpdateInfoWithReleaseNotes = UpdateInfo & {
	releaseNotes: string;
};
