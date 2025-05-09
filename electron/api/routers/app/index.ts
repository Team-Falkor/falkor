import AutoLaunch from "auto-launch";
import { app, BrowserWindow } from "electron";
import { z } from "zod";
import { downloadQueue } from "../../../handlers/downloads/queue";
import { gamesLaunched } from "../../../handlers/launcher/games-launched";
import { SettingsManager } from "../../../handlers/settings/settings";
import { publicProcedure, router } from "../../trpc";

const settings = SettingsManager.getInstance();

// Memoized main window
let mainWindow: BrowserWindow | null = null;

const getMainWindow = (): BrowserWindow | null => {
	if (mainWindow && !mainWindow.isDestroyed()) {
		return mainWindow;
	}
	mainWindow = BrowserWindow.getAllWindows()[0] ?? null;
	return mainWindow;
};

// Helper to return standard responses
const success = (message?: string) => ({ success: true, message });
const failure = (message: string) => ({ success: false, message });

export const appFunctionsRouter = router({
	autoLaunch: publicProcedure
		.input(z.object({ enabled: z.boolean(), isHidden: z.boolean() }))
		.mutation(async ({ input }) => {
			if (!app.isPackaged) {
				console.warn("[AutoLaunch] App is not packaged — skipping.");
				return failure("App is not packaged.");
			}

			try {
				const autoLauncher = new AutoLaunch({
					name: app.getName(),
					isHidden: input.isHidden,
				});

				if (input.enabled) {
					await autoLauncher.enable();
					console.log("[AutoLaunch] Enabled auto-launch.");
				} else {
					await autoLauncher.disable();
					console.log("[AutoLaunch] Disabled auto-launch.");
				}

				return success();
			} catch (error) {
				console.error("[AutoLaunch] Error toggling auto-launch:", error);
				return failure("Failed to toggle auto-launch.");
			}
		}),

	close: publicProcedure
		.input(
			z
				.object({
					confirmed: z.boolean().optional(),
				})
				.optional(),
		)
		.mutation(({ input }) => {
			const win = getMainWindow();
			const closeToTray = settings.get("closeToTray");

			if (!closeToTray) {
				win?.close();
				console.log("[App] Hidden to tray (closeToTray=false).");
				return success("App hidden to tray.");
			}

			if (gamesLaunched.size > 0) {
				console.warn("[App] Games running, close blocked.");
				return failure("Games are running. Confirm before quitting.");
			}

			const isDownloading = downloadQueue.getDownloads()?.length > 0;
			if (isDownloading && !input?.confirmed) {
				console.warn("[App] Downloads active, close blocked.");
				return failure("Downloads are active. Confirm before quitting.");
			}

			win?.destroy();
			console.log("[App] Quitting application.");
			return success();
		}),

	minimize: publicProcedure.mutation(() => {
		const win = getMainWindow();
		if (!win) {
			console.warn("[Window] No window to minimize.");
			return failure("No window to minimize.");
		}

		win.minimize();
		console.log("[Window] Window minimized.");
		return success();
	}),

	maximize: publicProcedure.mutation(() => {
		const win = getMainWindow();
		if (!win) {
			console.warn("[Window] No window to maximize.");
			return failure("No window to maximize.");
		}

		if (win.isMaximized()) {
			win.unmaximize();
			console.log("[Window] Window unmaximized.");
		} else {
			win.maximize();
			console.log("[Window] Window maximized.");
		}

		return success();
	}),
});
