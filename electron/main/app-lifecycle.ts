import os from "node:os";
import { app, BrowserWindow } from "electron";
import { cleanup, createWindow, showWindow } from "./window";

export function setupAppLifecycle(): void {
	// Disable GPU Acceleration for Windows 7
	if (os.release().startsWith("6.1")) {
		app.disableHardwareAcceleration();
	}

	// Set application name for Windows 10+ notifications
	if (process.platform === "win32") {
		app.setAppUserModelId(app.getName());
	}

	// Handle single instance lock
	if (!app.requestSingleInstanceLock()) {
		app.quit();
		process.exit(0);
	}

	// Handle window closed events
	app.on("window-all-closed", () => {
		if (process.platform !== "darwin") {
			app.quit();
		}
	});

	// Clean up resources before app quits
	app.on("before-quit", () => {
		cleanup();
	});

	// Handle second instance (someone tries to launch the app when it's already running)
	app.on("second-instance", () => {
		showWindow();
	});

	// Handle activation (macOS)
	app.on("activate", () => {
		const allWindows = BrowserWindow.getAllWindows();
		if (allWindows.length) {
			allWindows[0].focus();
		} else {
			createWindow();
		}
	});

	// Prevent accidental app termination on certain platforms
	if (process.platform === "darwin" || process.platform === "win32") {
		app.on("before-quit", (event) => {
			// If there are unsaved changes or other conditions requiring confirmation,
			// you could handle that here
		});
	}
}
