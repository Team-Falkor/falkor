import os from "node:os";
import { app, BrowserWindow } from "electron";
import { handleDeepLink } from "./deep-link";
import { cleanup, createWindow, showWindow } from "./window";

let initialDeepLink: string | undefined;

const rawArgv = process.argv;
if (process.platform !== "darwin") {
	initialDeepLink = rawArgv.find((arg) => arg.startsWith("falkor://"));
}

export function setupAppLifecycle(): void {
	if (process.defaultApp) {
		if (process.argv.length >= 2) {
			app.setAsDefaultProtocolClient("falkor", process.execPath, [
				process.argv[1],
			]);
		}
	} else {
		app.setAsDefaultProtocolClient("falkor");
	}

	if (os.release().startsWith("6.1")) {
		app.disableHardwareAcceleration();
	}

	if (process.platform === "win32") {
		app.setAppUserModelId(app.getName());
	}

	const gotTheLock = app.requestSingleInstanceLock();

	if (!gotTheLock) {
		app.quit();
		return;
	}

	// Handle application lifecycle events

	// When user tries to open a second instance of the app
	app.on("second-instance", (_event, argv) => {
		const deepLink = argv.find((arg) => arg.startsWith("falkor://"));
		if (deepLink) {
			showWindow();
			handleDeepLink(deepLink);
		} else {
			showWindow();
		}
	});

	// Handle macOS-specific deep linking
	app.on("open-url", (event, url) => {
		event.preventDefault();
		const allWindows = BrowserWindow.getAllWindows();
		if (allWindows.length > 0) {
			// If app is running, show window and process the deep link
			showWindow();
			handleDeepLink(url);
		} else {
			initialDeepLink = url;
		}
	});

	app.whenReady().then(() => {
		createWindow({
			initialDeepLink: initialDeepLink,
		});
	});

	app.on("window-all-closed", () => {
		if (process.platform !== "darwin") {
			app.quit();
		}
	});

	app.on("before-quit", () => {
		cleanup();
	});

	app.on("activate", () => {
		const allWindows = BrowserWindow.getAllWindows();
		if (allWindows.length) {
			allWindows[0].focus();
		} else {
			createWindow({
				initialDeepLink: initialDeepLink,
			});
		}
	});
}
