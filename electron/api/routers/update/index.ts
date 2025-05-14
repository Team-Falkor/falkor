import { createRequire } from "node:module";
import { TRPCError } from "@trpc/server";
import { app } from "electron";
import type { UpdateInfo } from "electron-updater";
import { publicProcedure, router } from "../../../api/trpc";
import { emitOnce } from "../../../utils/emit-once";

const { autoUpdater } = createRequire(import.meta.url)("electron-updater");

type UpdateAvailabilityPayload = {
	update: boolean;
	version: string;
	newVersion: string;
};

type DownloadProgressPayload = {
	bytesPerSecond: number;
	percent: number;
	transferred: number;
	total: number;
};

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
		if (!app.isPackaged) {
			yield {
				error: "Updates unavailable in development",
			};
			return;
		}

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
		// Configure updater
		autoUpdater.autoDownload = false;
		autoUpdater.allowDowngrade = false;
		autoUpdater.disableWebInstaller = false;

		// Kick off
		autoUpdater.downloadUpdate();

		try {
			let done = false;
			while (!done) {
				const ev = await Promise.race<
					| { type: "download-progress"; info: DownloadProgressPayload }
					| { type: "update-downloaded" }
					| { type: "error"; err: Error }
				>([
					emitOnce<DownloadProgressPayload>(
						autoUpdater,
						"download-progress",
					).then((info) => ({ type: "download-progress" as const, info })),
					emitOnce<void>(autoUpdater, "update-downloaded").then(() => ({
						type: "update-downloaded" as const,
					})),
					emitOnce<Error>(autoUpdater, "error").then((err) => ({
						type: "error" as const,
						err,
					})),
				]);

				if (ev.type === "download-progress") {
					yield { type: "download-progress", info: ev.info };
				} else if (ev.type === "update-downloaded") {
					yield { type: "update-downloaded" };
					done = true;
				} else {
					yield { type: "error", error: ev.err.message };
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
