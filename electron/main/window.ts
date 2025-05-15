import { existsSync } from "node:fs";
import path from "node:path";
import { db } from "@backend/database";
import {
	app,
	BrowserWindow,
	Menu,
	nativeImage,
	screen,
	shell,
	Tray,
} from "electron";
import { createIPCHandler } from "trpc-electron/main";
import { appRouter } from "../api/trpc/root";
import { SettingsManager } from "../handlers/settings/settings";
import { INDEX_HTML, PRELOAD_PATH, VITE_DEV_SERVER_URL } from "./constants";

// Types
export interface WindowOptions {
	enableDevTools?: boolean;
	showOnStartup?: boolean;
	createTray?: boolean;
}

// State variables
let win: BrowserWindow | null = null;
let tray: Tray | null = null;
const settings = SettingsManager.getInstance();

/**
 * Creates the main application window
 */
export async function createWindow(
	options: WindowOptions = {},
): Promise<BrowserWindow> {
	// Return existing window if already created
	if (win) {
		console.log("Window already exists, returning existing instance");
		return win;
	}

	try {
		// Get screen dimensions
		const { width, height } = screen.getPrimaryDisplay().workAreaSize;

		// Get window style from settings
		const titleBarStyle = settings.get("titleBarStyle");
		const frame = titleBarStyle === "native" || titleBarStyle === "none";

		// Resolve icon path
		const iconPath = path.join(
			process.env.VITE_PUBLIC ?? "",
			"icon-256x256.png",
		);
		const iconExists = existsSync(iconPath);

		if (!iconExists) {
			console.warn(`Icon not found at path: ${iconPath}`);
		}

		const devToolsOverride = import.meta.env.VITE_DEVTOOLS_OVERRIDE === "true";

		// Create the browser window
		win = new BrowserWindow({
			title: "Falkor",
			icon: iconExists ? iconPath : undefined,
			webPreferences: {
				preload: PRELOAD_PATH,
				devTools: devToolsOverride || options.enableDevTools || !app.isPackaged,
				// devTools: true,
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

		// TODO: add a setting for this
		win.maximize();

		// Load the app URL
		if (VITE_DEV_SERVER_URL) {
			await win.loadURL(VITE_DEV_SERVER_URL);
		} else {
			await win.loadFile(INDEX_HTML);
		}

		// Set up window event handlers
		setupWindowEvents(win);

		// Create tRPC IPC handler
		createIPCHandler({
			router: appRouter,
			windows: [win],
			createContext() {
				return Promise.resolve({
					db,
					headers: new Headers(),
				});
			},
		});

		app.whenReady().then(() => {
			// Initialize tray if needed
			if (options.createTray ?? true) {
				createTray();
			}
		});

		console.log("Main window created successfully");
		return win;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(`Failed to create window: ${errorMessage}`);
		throw error;
	}
}

/**
 * Sets up event handlers for the main window
 */
function setupWindowEvents(windowInstance: BrowserWindow): void {
	// Make all links open with the browser, not with the application
	windowInstance.webContents.setWindowOpenHandler(({ url }) => {
		if (url.startsWith("https:")) shell.openExternal(url);
		return { action: "deny" };
	});

	// Send initial message when window loads
	windowInstance.webContents.on("did-finish-load", () => {
		windowInstance.webContents.send(
			"main-process-message",
			new Date().toLocaleString(),
		);
	});

	// Clean up references when window is closed
	windowInstance.on("closed", () => {
		win = null;
	});
}

/**
 * Creates the system tray icon and menu
 */
export function createTray(): Tray | null {
	// Prevent re-creating tray
	if (tray) {
		console.log("Tray already exists, skipping creation");
		return tray;
	}

	try {
		// Resolve tray icon path
		const trayIconPath = path.join(
			process.env.VITE_PUBLIC ?? "",
			"icon-16x16.png",
		);

		// Verify icon exists
		if (!existsSync(trayIconPath)) {
			console.error(`Tray icon not found at path: ${trayIconPath}`);
			return null;
		}

		const trayImage = nativeImage.createFromPath(trayIconPath);

		tray = new Tray(trayImage);
		tray.setToolTip("Falkor");

		// Set context menu
		updateTrayMenu();

		// Set up event handlers
		tray.on("double-click", showWindow);
		tray.on("click", showWindow);

		console.log("Tray icon created successfully");
		return tray;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(`Failed to create tray: ${errorMessage}`);
		return null;
	}
}

/**
 * Updates the tray context menu
 */
export function updateTrayMenu(): void {
	if (!tray) return;

	const contextMenu = Menu.buildFromTemplate([
		{
			type: "normal",
			label: "Open Falkor",
			click: showWindow,
		},
		{ type: "separator" },
		{
			type: "normal",
			label: "Quit Falkor",
			click: safeQuit,
		},
	]);

	tray.setContextMenu(contextMenu);
}

/**
 * Shows the main window, creating it if necessary
 */
export function showWindow(): void {
	if (!win) {
		createWindow();
		return;
	}

	if (win.isMinimized()) {
		win.restore();
	}

	win.show();
	win.focus();
}

/**
 * Safely quits the application
 */
export function safeQuit(): void {
	app.quit();
}

/**
 * Gets the main application window
 */
export function getMainWindow(): BrowserWindow | null {
	return win;
}

/**
 * Gets the system tray instance
 */
export function getTray(): Tray | null {
	return tray;
}

/**
 * Cleanup resources before quitting
 */
export function cleanup(): void {
	if (tray) {
		tray.destroy();
		tray = null;
	}
}

export const emitToFrontend = <TData>(
	channel: string,
	data?: TData,
): boolean => {
	if (!channel || typeof channel !== "string") {
		console.log("error", "Invalid channel name for IPC communication");
		return false;
	}

	if (!win || win.isDestroyed()) {
		console.log(
			"warn",
			`Cannot emit to frontend (${channel}): window does not exist or is destroyed`,
		);
		return false;
	}

	try {
		win.webContents.send(channel, data);
		return true;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.log(
			"error",
			`Failed to emit to frontend (${channel}): ${errorMessage}`,
		);
		return false;
	}
};
