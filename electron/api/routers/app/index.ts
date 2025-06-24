import { existsSync } from "node:fs";
import { constants } from "@backend/utils/constants";
import { playSound } from "@backend/utils/playsound";
import AutoLaunch from "auto-launch";
import { app, BrowserWindow, dialog } from "electron";
import { z } from "zod";
import { Sound } from "@/@types";
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

const openDialogOptionsSchema = z.object({
	title: z.string().optional(),
	defaultPath: z.string().optional(),
	buttonLabel: z.string().optional(),
	filters: z
		.array(
			z.object({
				name: z.string(),
				extensions: z.array(z.string()),
			}),
		)
		.optional(),
	properties: z
		.array(
			z.union([
				z.literal("openFile"),
				z.literal("openDirectory"),
				z.literal("multiSelections"),
				z.literal("showHiddenFiles"),
				z.literal("createDirectory"),
				z.literal("promptToCreate"),
				z.literal("noResolveAliases"),
				z.literal("treatPackageAsDirectory"),
				z.literal("dontAddToRecent"),
			]),
		)
		.optional(),
	message: z.string().optional(),
	securityScopedBookmarks: z.boolean().optional(),
});

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

			if (closeToTray) {
				win?.hide();
				console.log("[App] Hidden to tray (closeToTray=true).");
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

	testSound: publicProcedure
		.input(z.object({ sound: z.nativeEnum<typeof Sound>(Sound) }))
		.mutation(async ({ input }) => {
			try {
				console.log("Current platform:", process.platform);
				console.log("Process permissions:", {
					uid: process.getuid?.() || "N/A",
					gid: process.getgid?.() || "N/A",
				});

				// Get the sound file path from constants using the enum value
				const soundPath = constants.assets.sounds[input.sound];

				// Debug logging
				console.log(`Attempting to play sound: ${input.sound}`);
				console.log(`Sound path: ${soundPath}`);

				// Verify file exists before playing
				if (!soundPath || !existsSync(soundPath)) {
					console.error(`Sound file does not exist at path: ${soundPath}`);
					return {
						success: false,
						message: `Sound file not found: ${soundPath}`,
					};
				}

				await playSound(soundPath);

				return {
					success: true,
					message: `Playing sound: ${input.sound}`,
				};
			} catch (error) {
				console.error("Sound playback error:", error);
				return {
					success: false,
					message: `Error playing sound: ${
						error instanceof Error ? error.message : String(error)
					}`,
				};
			}
		}),

	openDialog: publicProcedure
		.input(openDialogOptionsSchema)
		.mutation(async ({ input }) => {
			try {
				const { canceled, filePaths } = await dialog.showOpenDialog(input);

				if (canceled) {
					return {
						success: true,
						canceled: true,
						filePaths: [],
						message: "File selection canceled.",
					};
				}

				return {
					success: true,
					canceled: false,
					filePaths,
					message: null,
				};
			} catch (error) {
				console.error("[openDialog] Error showing dialog:", error);
				return {
					success: false,
					canceled: false,
					filePaths: [],
					message:
						error instanceof Error
							? error.message
							: "An unknown error occurred during dialog.",
				};
			}
		}),

	appInfo: publicProcedure.query(() => {
		return {
			appName: app.getName(),
			appVersion: app.getVersion(),
			isPackaged: app.isPackaged,
		};
	}),
});
