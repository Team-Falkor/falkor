import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "@backend/database";
import { BrowserWindow, app, ipcMain, shell } from "electron";
import { createIPCHandler } from "trpc-electron/main";
import { appRouter } from "../api/trpc/root";
import { SettingsManager } from "../handlers/settings/settings";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, "../..");

export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
	? path.join(process.env.APP_ROOT, "public")
	: RENDERER_DIST;

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
	app.quit();
	process.exit(0);
}

let win: BrowserWindow | null = null;
const preload = path.join(__dirname, "../preload/index.mjs");
const indexHtml = path.join(RENDERER_DIST, "index.html");

const settings = SettingsManager.getInstance();

async function createWindow() {
	const titleBarStyle = settings.get("titleBarStyle");
	const frame = titleBarStyle === "native" || titleBarStyle === "none";

	win = new BrowserWindow({
		title: "Falkor",
		icon: path.join(process.env.VITE_PUBLIC, "icon.png"),
		webPreferences: {
			preload,
		},
		frame,
		minWidth: 1000,
		minHeight: 600,
	});

	if (VITE_DEV_SERVER_URL) {
		// #298
		win.loadURL(VITE_DEV_SERVER_URL);
	} else {
		win.loadFile(indexHtml);
	}

	// Test actively push message to the Electron-Renderer
	win.webContents.on("did-finish-load", () => {
		win?.webContents.send("main-process-message", new Date().toLocaleString());
	});

	// Make all links open with the browser, not with the application
	win.webContents.setWindowOpenHandler(({ url }) => {
		if (url.startsWith("https:")) shell.openExternal(url);
		return { action: "deny" };
	});

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
}

app.whenReady().then(async () => {
	await createWindow();
});

app.on("window-all-closed", () => {
	win = null;
	if (process.platform !== "darwin") app.quit();
});

app.on("second-instance", () => {
	if (win) {
		// Focus on the main window if the user tried to open another
		if (win.isMinimized()) win.restore();
		win.focus();
	}
});

app.on("activate", () => {
	const allWindows = BrowserWindow.getAllWindows();
	if (allWindows.length) {
		allWindows[0].focus();
	} else {
		createWindow();
	}
});

// New window example arg: new windows url
ipcMain.handle("open-win", (_, arg) => {
	const childWindow = new BrowserWindow({
		webPreferences: {
			preload,
			nodeIntegration: true,
			contextIsolation: false,
		},
	});

	if (VITE_DEV_SERVER_URL) {
		childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`);
	} else {
		childWindow.loadFile(indexHtml, { hash: arg });
	}
});
