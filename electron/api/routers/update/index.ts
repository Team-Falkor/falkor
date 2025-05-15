import { TRPCError } from "@trpc/server";
import { app } from "electron";
import type { UpdateInfo } from "electron-updater";
import electronUpdater from "electron-updater";
import {
	DownloadEventType,
	type DownloadProgressPayload,
	type UpdateAvailabilityPayload,
} from "@/@types";
import { publicProcedure, router } from "../../../api/trpc";
import { emitOnce } from "../../../utils/emit-once";

const { autoUpdater } = electronUpdater;
// Configure updater
autoUpdater.allowDowngrade = true;
autoUpdater.autoInstallOnAppQuit = false;
autoUpdater.autoDownload = false;
autoUpdater.forceDevUpdateConfig = true;
autoUpdater.fullChangelog = false;

export const updateRouter = router({
	/**
	 * Checks for updates and notifies (shows dialog or UI)
	 */
	checkUpdate: publicProcedure.query(async () => {
		if (!app.isPackaged) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Updates are only available in packaged builds",
			});
		}

		try {
			// This will emit "update-available" or "update-not-available"
			return await autoUpdater.checkForUpdatesAndNotify();
		} catch (err) {
			console.error(err);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to check for updates",
			});
		}
	}),

	/**
	 * Subscription: emits once when an update is available or not
	 */
	subscribeAvailability: publicProcedure.subscription(async function* () {
		// if (!app.isPackaged) {
		// 	yield {
		// 		error: "Updates unavailable in development",
		// 	};
		// 	return;
		// }

		try {
			// Race between available / not-available
			const result = await Promise.race<
				| { available: true; info: UpdateInfo }
				| { available: false; info: UpdateInfo }
			>([
				emitOnce<UpdateInfo>(autoUpdater, "update-available").then((info) => ({
					available: true as const,
					info,
				})),
				emitOnce<UpdateInfo>(autoUpdater, "update-not-available").then(
					(info) => ({ available: false as const, info }),
				),
			]);

			const payload: UpdateAvailabilityPayload = {
				update: result.available,
				version: app.getVersion(),
				newVersion: result.info.version,
			};

			yield payload;
		} catch (err) {
			yield { error: (err as Error).message };
		} finally {
			autoUpdater.removeAllListeners("update-available");
			autoUpdater.removeAllListeners("update-not-available");
		}
	}),

	/**
	 * Subscription: starts download and streams progress until complete or error
	 */
	startDownload: publicProcedure.subscription(async function* () {
		// Kick off
		autoUpdater.downloadUpdate();

		try {
			let done = false;
			while (!done) {
				const ev = await Promise.race<
					| {
							type: DownloadEventType.DownloadProgress;
							info: DownloadProgressPayload;
					  }
					| { type: DownloadEventType.UpdateDownloaded }
					| { type: DownloadEventType.Error; err: Error }
				>([
					emitOnce<DownloadProgressPayload>(
						autoUpdater,
						"download-progress",
					).then((info) => ({
						type: DownloadEventType.DownloadProgress,
						info,
					})),
					emitOnce<void>(autoUpdater, "update-downloaded").then(() => ({
						type: DownloadEventType.UpdateDownloaded,
					})),
					emitOnce<Error>(autoUpdater, "error").then((err) => ({
						type: DownloadEventType.Error,
						err,
					})),
				]);

				if (ev.type === DownloadEventType.DownloadProgress) {
					yield { type: DownloadEventType.DownloadProgress, info: ev.info };
				} else if (ev.type === DownloadEventType.UpdateDownloaded) {
					yield { type: DownloadEventType.UpdateDownloaded };
					done = true;
				} else {
					yield { type: DownloadEventType.Error, error: ev.err.message };
					done = true;
				}
			}
		} finally {
			autoUpdater.removeAllListeners("download-progress");
			autoUpdater.removeAllListeners("update-downloaded");
			autoUpdater.removeAllListeners("error");
		}
	}),

	/**
	 * Immediately quits and installs the downloaded update
	 */
	quitAndInstall: publicProcedure.mutation(async () => {
		autoUpdater.quitAndInstall(false, true);
		return { installed: true };
	}),
});

export type UpdateRouter = typeof updateRouter;
