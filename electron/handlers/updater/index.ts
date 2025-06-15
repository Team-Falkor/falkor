import { emitToFrontend } from "@backend/main/window";
import electronUpdater, { type UpdateInfo } from "electron-updater";
import { UpdateStatus } from "@/@types";
import { SettingsManager } from "../settings/settings";

const { autoUpdater } = electronUpdater;

class Updater {
	private settings: SettingsManager;
	private status: UpdateStatus = UpdateStatus.IDLE;
	private lastUpdateInfo: UpdateInfo | null = null;

	constructor() {
		this.settings = SettingsManager.getInstance();

		autoUpdater.autoDownload = false;
		autoUpdater.autoInstallOnAppQuit = false;
		autoUpdater.allowDowngrade = false;
		autoUpdater.forceDevUpdateConfig = process.env.NODE_ENV === "development";
		autoUpdater.fullChangelog = false;

		this.log("Updater initialized.");
		this.log(
			`forceDevUpdateConfig is set to: ${autoUpdater.forceDevUpdateConfig}`,
		);

		this.registerEventListeners();
	}

	private log(message: string, ...args: unknown[]) {
		console.log(`[Updater] ${message}`, ...args);
	}

	public setStatus(status: UpdateStatus) {
		if (this.status === status) return;
		this.status = status;
		this.log(`Status changed to: ${status}`);
		emitToFrontend("updater:status-changed", status);
	}

	public getStatus(): UpdateStatus {
		return this.status;
	}

	public getUpdateInfo(): UpdateInfo | null {
		return this.lastUpdateInfo;
	}

	private registerEventListeners() {
		this.log("Registering event listeners...");

		autoUpdater.on("checking-for-update", () => {
			this.log("Event: checking-for-update");
			this.setStatus(UpdateStatus.CHECKING);
		});

		autoUpdater.on("update-available", (info: UpdateInfo) => {
			this.log("Event: update-available", info);
			this.lastUpdateInfo = info;
			this.setStatus(UpdateStatus.UPDATE_AVAILABLE);
			emitToFrontend("updater:update-available", info);
		});

		autoUpdater.on("update-not-available", (info) => {
			this.log("Event: update-not-available", info);
			this.setStatus(UpdateStatus.IDLE);
		});

		autoUpdater.on("download-progress", (progress) => {
			this.log(`Event: download-progress - ${Math.floor(progress.percent)}%`);
			if (this.status !== UpdateStatus.DOWNLOADING) {
				this.setStatus(UpdateStatus.DOWNLOADING);
			}
			emitToFrontend("updater:download-progress", Math.floor(progress.percent));
		});

		autoUpdater.on("update-downloaded", (info: UpdateInfo) => {
			this.log("Event: update-downloaded", info);
			this.setStatus(UpdateStatus.DOWNLOADED);
			emitToFrontend("updater:update-downloaded", info);
		});

		autoUpdater.on("error", (error: Error) => {
			this.log("Event: error", error);
			this.setStatus(UpdateStatus.ERROR);
			emitToFrontend(
				"updater:error",
				error.message || "An unknown error occurred",
			);
		});
	}

	public async checkForUpdates(): Promise<void> {
		this.log("Action: checkForUpdates called.");
		const autoCheckEnabled = this.settings.get("autoCheckForUpdates");
		if (!autoCheckEnabled) {
			this.log("Check skipped: autoCheckForUpdates setting is disabled.");
			return;
		}

		if (this.status !== UpdateStatus.IDLE) {
			this.log(
				`Check skipped: updater is not idle (current status: ${this.status}).`,
			);
			return;
		}

		try {
			this.log("Executing autoUpdater.checkForUpdates()...");
			const result = await autoUpdater.checkForUpdates();
			this.log("checkForUpdates() completed.", result);
		} catch (error) {
			this.log("Error during checkForUpdates execution.", error);
		}
	}

	public async downloadUpdate(): Promise<void> {
		this.log("Action: downloadUpdate called.");
		if (this.status !== UpdateStatus.UPDATE_AVAILABLE) {
			this.log(
				`Download skipped: no update available (current status: ${this.status}).`,
			);
			return;
		}

		try {
			this.log("Executing autoUpdater.downloadUpdate()...");
			const result = await autoUpdater.downloadUpdate();
			this.log("downloadUpdate() completed.", result);
		} catch (error) {
			this.log("Error during downloadUpdate execution.", error);
		}
	}

	public installUpdate(): void {
		this.log("Action: installUpdate called.");
		if (this.status !== UpdateStatus.DOWNLOADED) {
			this.log(
				`Install skipped: no update downloaded (current status: ${this.status}).`,
			);
			return;
		}

		this.log("Executing autoUpdater.quitAndInstall()...");
		autoUpdater.quitAndInstall();
	}
}

export default new Updater();
