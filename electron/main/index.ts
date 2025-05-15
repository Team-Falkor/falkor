import { app } from "electron";
import { setupAppLifecycle } from "./app-lifecycle";
import { setupIPC } from "./ipc";
import { createWindow } from "./window";
import "./constants";
import "../handlers/updater/events";

// Setup app lifecycle handlers
setupAppLifecycle();

// Setup IPC handlers
setupIPC();

// Create main window when app is ready
app.whenReady().then(async () => {
	await createWindow();
});
