import { existsSync } from "node:fs";
import path from "node:path";
import { db } from "@backend/database";
import { libraryGames } from "@backend/database/schemas";
import { downloadQueue } from "@backend/handlers/downloads/queue";
import GameProcessLauncher from "@backend/handlers/launcher/game-process-launcher";
import { gamesLaunched } from "@backend/handlers/launcher/games-launched";
import logging from "@backend/handlers/logging";
import { createIPCHandler } from "@janwirth/electron-trpc-link/main";
import { desc, type InferSelectModel } from "drizzle-orm";
import {
	app,
	BrowserWindow,
	Menu,
	nativeImage,
	screen,
	shell,
	Tray,
} from "electron";
import type { ToastNotification } from "@/@types";
import { appRouter } from "../api/trpc/root";
import { SettingsManager } from "../handlers/settings/settings";
import { INDEX_HTML, PRELOAD_PATH, VITE_DEV_SERVER_URL } from "./constants";
import { handleDeepLink } from "./deep-link";

export interface WindowOptions {
	enableDevTools?: boolean;
	showOnStartup?: boolean;
	createTray?: boolean;
	initialDeepLink?: string;
}

let win: BrowserWindow | null = null;
let tray: Tray | null = null;
let isWindowReady = false;
let pendingToasts: ToastNotification[] = [];
let readinessCheckInterval: NodeJS.Timeout | null = null;
const settings = SettingsManager.getInstance();

export async function createWindow(
	options: WindowOptions = {},
): Promise<BrowserWindow> {
	console.log("createWindow: Attempting to create main window.");
	if (win) {
		console.log(
			"createWindow: Window already exists, returning existing instance.",
		);
		return win;
	}

	try {
		const { width, height } = screen.getPrimaryDisplay().workAreaSize;
		const titleBarStyle = settings.get("titleBarStyle");
		const frame = titleBarStyle === "native" || titleBarStyle === "none";
		const iconPath = path.join(
			process.env.VITE_PUBLIC ?? "",
			"icon-256x256.png",
		);
		const iconExists = existsSync(iconPath);

		if (!iconExists) {
			console.warn(`createWindow: Icon not found at path: ${iconPath}`);
		}

		const devToolsOverride = import.meta.env.VITE_DEVTOOLS_OVERRIDE === "true";

		win = new BrowserWindow({
			title: "Falkor",
			icon: iconExists ? iconPath : undefined,
			webPreferences: {
				preload: PRELOAD_PATH,
				devTools: devToolsOverride || options.enableDevTools || !app.isPackaged,
				contextIsolation: true,
				nodeIntegration: false,
			},
			backgroundColor: "#020817",
			autoHideMenuBar: false,
			minWidth: 1000,
			minHeight: 600,
			frame,
			width: Math.min(width * 0.8, 1200),
			height: Math.min(height * 0.8, 800),
			resizable: true,
			show: options.showOnStartup ?? true,
		});

		win.maximize();
		console.log("createWindow: Window created with dimensions and maximized.");

		if (VITE_DEV_SERVER_URL) {
			console.log(`createWindow: Loading URL: ${VITE_DEV_SERVER_URL}`);
			await win.loadURL(VITE_DEV_SERVER_URL);
		} else {
			console.log(`createWindow: Loading file: ${INDEX_HTML}`);
			await win.loadFile(INDEX_HTML);
		}

		setupWindowEvents(win, options);
		setupIPCHandler(win);
		startReadinessCheck();
		console.log("createWindow: Readiness check started.");

		if (options.createTray ?? true) {
			await createTray();
		}

		console.log("createWindow: Main window created successfully");
		return win;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(`createWindow: Failed to create window: ${errorMessage}`);
		throw error;
	}
}

function setupIPCHandler(windowInstance: BrowserWindow): void {
	console.log("setupIPCHandler: Setting up IPC handler.");
	createIPCHandler({
		router: appRouter,
		windows: [windowInstance],
		createContext() {
			return Promise.resolve({
				db,
				headers: new Headers(),
			});
		},
	});
}

function setupWindowEvents(
	windowInstance: BrowserWindow,
	options: WindowOptions,
): void {
	console.log("setupWindowEvents: Setting up window event handlers.");
	windowInstance.webContents.setWindowOpenHandler(({ url }) => {
		console.log(`setupWindowEvents: Window open handler for URL: ${url}`);
		if (url.startsWith("https:")) shell.openExternal(url);
		return { action: "deny" };
	});

	windowInstance.webContents.on("did-finish-load", () => {
		console.log("setupWindowEvents: WebContents did-finish-load event.");
		windowInstance.webContents.send(
			"main-process-message",
			new Date().toLocaleString(),
		);

		if (options.initialDeepLink) {
			console.log(
				`setupWindowEvents: Handling initial deep link: ${options.initialDeepLink}`,
			);
			handleDeepLink(options.initialDeepLink);
		}
	});

	windowInstance.webContents.on("did-start-loading", () => {
		console.log(
			"setupWindowEvents: WebContents did-start-loading event. Resetting window readiness.",
		);
		isWindowReady = false;
		clearReadinessCheck();
	});

	windowInstance.on("closed", () => {
		console.log("setupWindowEvents: Window closed. Cleaning up resources.");
		cleanup();
	});
}

function startReadinessCheck(): void {
	console.log("startReadinessCheck: Starting frontend readiness check.");
	clearReadinessCheck();

	readinessCheckInterval = setInterval(async () => {
		console.log("startReadinessCheck: Performing readiness check.");
		if (!win || win.isDestroyed()) {
			console.log(
				"startReadinessCheck: Window not found or destroyed, clearing readiness check.",
			);
			clearReadinessCheck();
			return;
		}

		try {
			const isReady = await win.webContents.executeJavaScript(`
        (function() {
          try {
            return !!(window.React || document.querySelector('[data-react-root]') || document.getElementById('root'));
          } catch (e) {
            return false;
          }
        })()
      `);

			if (isReady && !isWindowReady) {
				console.log(
					"startReadinessCheck: Frontend ready detected, waiting 5 seconds before sending toasts...",
				);
				isWindowReady = true;
				clearReadinessCheck();

				setTimeout(() => {
					processPendingToasts();
				}, 5000);
			} else if (!isReady) {
				console.log("startReadinessCheck: Frontend not yet ready.");
			}
		} catch (error) {
			console.warn(
				"startReadinessCheck: Error checking frontend readiness:",
				error,
			);
		}
	}, 5000);
}

function clearReadinessCheck(): void {
	if (readinessCheckInterval) {
		console.log("clearReadinessCheck: Clearing readiness check interval.");
		clearInterval(readinessCheckInterval);
		readinessCheckInterval = null;
	}
}

function processPendingToasts(): void {
	console.log("processPendingToasts: Attempting to process pending toasts.");
	if (
		!isWindowReady ||
		!win ||
		win.isDestroyed() ||
		pendingToasts.length === 0
	) {
		console.log("processPendingToasts: Conditions not met to process toasts.");
		return;
	}

	console.log(
		`processPendingToasts: Processing ${pendingToasts.length} pending toast notifications.`,
	);

	pendingToasts.forEach((toast) => {
		if (win && !win.isDestroyed()) {
			try {
				win.webContents.send("toast:show", toast);
				console.log(
					`processPendingToasts: Sent toast: ${toast.message || toast.description}`,
				);
			} catch (error) {
				console.error(
					"processPendingToasts: Failed to send pending toast:",
					error,
				);
			}
		}
	});

	pendingToasts = [];
	console.log("processPendingToasts: Pending toasts queue cleared.");
}

export async function createTray(): Promise<Tray | null> {
	console.log("createTray: Attempting to create system tray icon.");
	if (tray) {
		console.log("createTray: Tray already exists, skipping creation.");
		return tray;
	}

	try {
		const trayIconPath = path.join(
			process.env.VITE_PUBLIC ?? "",
			"icon-32x32.png",
		);

		if (!existsSync(trayIconPath)) {
			console.error(`createTray: Tray icon not found at path: ${trayIconPath}`);
			return null;
		}

		const trayImage = nativeImage.createFromPath(trayIconPath);
		tray = new Tray(trayImage);
		tray.setToolTip("Falkor");

		await updateTrayMenu();
		tray.on("double-click", showWindow);
		tray.on("click", showWindow);

		console.log("createTray: Tray icon created successfully.");
		return tray;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(`createTray: Failed to create tray: ${errorMessage}`);
		return null;
	}
}

/**
 * Helper function to launch a game.
 * @param game The game object from the database, typed by Drizzle's InferSelectModel.
 */
async function launchGame(
	game: InferSelectModel<typeof libraryGames>,
): Promise<void> {
	if (!game || !game.gamePath) {
		logging.log("info", "Game or game path not found, cannot launch.");
		return;
	}

	const existingLauncher = gamesLaunched.get(game.id);
	if (existingLauncher) {
		logging.log("info", `Game "${game.gameName}" is already launched.`);
		return;
	}

	const launcher = new GameProcessLauncher({
		id: game.id,
		gameId: game.gameId,
		gamePath: game.gamePath,
		gameName: game.gameName,
		gameIcon: game.gameIcon ?? undefined,
		steamId: game.gameSteamId ?? undefined,
		gameArgs: game.gameArgs?.split(" ") ?? undefined,
		commandOverride: game.gameCommand ?? undefined,
		winePrefixPath: game.winePrefixFolder ?? undefined,
		runAsAdmin: game.runAsAdmin ?? false,
	});

	try {
		await launcher.launchGame();
		gamesLaunched.set(game.id, launcher);
		logging.log(
			"info",
			`Successfully launched game ${game.gameName} (${game.id}).`,
		);
	} catch (error) {
		logging.log(
			"error",
			`Failed to launch game ${game.id}: ${(error as Error).message}`,
		);
		gamesLaunched.delete(game.id);
	}
}

/**
 * Updates the Electron tray context menu with the most recently played games.
 */
export async function updateTrayMenu(): Promise<void> {
	console.log("updateTrayMenu: Attempting to update tray context menu.");

	if (!tray) {
		console.log("updateTrayMenu: Tray does not exist, cannot update menu.");
		return;
	}

	const lastPlayedGames = await db
		.select()
		.from(libraryGames)
		.orderBy(desc(libraryGames.gameLastPlayed))
		.limit(5);

	const gameMenuItems: Array<Electron.MenuItemConstructorOptions> =
		lastPlayedGames.map((game): Electron.MenuItemConstructorOptions => {
			return {
				type: "normal",
				label: game.gameName,
				click: async () => {
					await launchGame(game);
				},
			};
		});

	const contextMenuTemplate: Array<Electron.MenuItemConstructorOptions> = [
		{
			type: "normal",
			label: "Open Falkor",
			click: showWindow,
		},
	];

	if (gameMenuItems.length > 0) {
		contextMenuTemplate.push({ type: "separator" });
		contextMenuTemplate.push({
			type: "submenu",
			label: "Continue Playing",
			submenu: gameMenuItems,
		});
	}

	contextMenuTemplate.push({ type: "separator" });

	contextMenuTemplate.push({
		type: "normal",
		label: "Quit Falkor",
		click: safeQuit,
	});

	const contextMenu = Menu.buildFromTemplate(contextMenuTemplate);

	tray.setContextMenu(contextMenu);
	console.log("updateTrayMenu: Tray context menu updated.");
}

export function showWindow(): void {
	console.log("showWindow: Attempting to show main window.");
	if (!win) {
		console.log("showWindow: Window does not exist, creating new window.");
		createWindow();
		return;
	}

	if (win.isMinimized()) {
		console.log("showWindow: Window is minimized, restoring.");
		win.restore();
	}

	win.show();
	win.focus();
	console.log("showWindow: Window shown and focused.");
}

export function safeQuit(): void {
	console.log("safeQuit: Quitting application safely.");
	app.quit();
}

export function getMainWindow(): BrowserWindow | null {
	console.log("getMainWindow: Getting main window instance.");
	return win;
}

export function getTray(): Tray | null {
	console.log("getTray: Getting system tray instance.");
	return tray;
}

export function cleanup(): void {
	console.log("cleanup: Performing application cleanup.");
	clearReadinessCheck();
	isWindowReady = false;
	pendingToasts = [];
	win = null;
	console.log("cleanup: Window reference cleared.");

	if (tray) {
		tray.destroy();
		tray = null;
		console.log("cleanup: Tray destroyed and reference cleared.");
	}
	console.log("cleanup: Cleanup complete.");
}

export async function destroyApp() {
	cleanup();
	await downloadQueue.destroy();

	win?.destroy();
	app.quit();
}

export const emitToFrontend = <TData>(
	channel: string,
	data?: TData,
): boolean => {
	console.log(`emitToFrontend: Attempting to emit to channel: ${channel}`);
	if (!channel || typeof channel !== "string") {
		console.error("emitToFrontend: Invalid channel name for IPC communication");
		return false;
	}

	if (!win || win.isDestroyed()) {
		console.warn(
			`emitToFrontend: Cannot emit to frontend (${channel}): window does not exist or is destroyed`,
		);
		return false;
	}

	try {
		win.webContents.send(channel, data);
		console.log(`emitToFrontend: Successfully emitted to channel: ${channel}`);
		return true;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(
			`emitToFrontend: Failed to emit to frontend (${channel}): ${errorMessage}`,
		);
		return false;
	}
};

export function sendToastNotification(toast: ToastNotification): void {
	console.log(
		`sendToastNotification: Received toast: ${toast.message || toast.description}`,
	);
	if (!win || win.isDestroyed()) {
		console.log(
			"sendToastNotification: Window not available or destroyed. Attempting to create window and queue toast.",
		);
		pendingToasts.push(toast);
		createWindow({
			showOnStartup: true,
			createTray: true,
			enableDevTools: false,
		});
		return;
	}

	if (isWindowReady) {
		try {
			win.webContents.send("toast:show", toast);
			console.log(
				"sendToastNotification: Toast notification sent immediately.",
			);
		} catch (error) {
			console.error(
				"sendToastNotification: Failed to send toast notification immediately:",
				error,
			);
		}
		return;
	}

	pendingToasts.push(toast);
	console.log(
		`sendToastNotification: Toast notification queued (${pendingToasts.length} pending).`,
	);

	if (!readinessCheckInterval) {
		console.log(
			"sendToastNotification: Starting readiness check due to queued toast.",
		);
		startReadinessCheck();
	}
}
