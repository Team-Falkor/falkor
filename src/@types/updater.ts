export type UpdateAvailabilityPayload = {
	update: boolean;
	version: string;
	newVersion: string;
};

export type DownloadProgressPayload = {
	bytesPerSecond: number;
	percent: number;
	transferred: number;
	total: number;
};

// 1. Define the enum
export enum DownloadEventType {
	DownloadProgress = "download-progress",
	UpdateDownloaded = "update-downloaded",
	Error = "error",
}

// 2. Use the enum in your event types
export type DownloadProgressEvent = {
	type: DownloadEventType.DownloadProgress;
	info: DownloadProgressPayload;
};

export type UpdateDownloadedEvent = {
	type: DownloadEventType.UpdateDownloaded;
};

export type ErrorEvent = {
	type: DownloadEventType.Error;
	error: string;
};

export type DownloadEvent =
	| DownloadProgressEvent
	| UpdateDownloadedEvent
	| ErrorEvent;
