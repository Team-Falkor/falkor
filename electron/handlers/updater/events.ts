import { emitToFrontend } from "@backend/main/window";
import { app, ipcMain } from "electron";
import { UpdateStatus } from "@/@types";
import updater from ".";

/**
 * A robust, generic wrapper for registering ipcMain.handle events.
 * It provides centralized logging and error handling.
 *
 * @param eventName The name of the event to handle.
 * @param handler The function to call when the event is received.
 * @param options Additional options for event registration.
 */
export function registerEvent<
	HandlerArgs extends Array<unknown>,
	HandlerOutput,
>(
	eventName: string,
	handler: (
		event: Electron.IpcMainInvokeEvent,
		...args: HandlerArgs
	) => HandlerOutput | Promise<HandlerOutput>,
	options: { silent?: boolean } = {},
): void {
	if (!eventName || typeof eventName !== "string") {
		throw new Error("Event name must be a non-empty string");
	}

	if (!app.isPackaged && !options.silent) {
		console.log(`[IPC] Registering handler for: ${eventName}`);
	}

	// Remove any existing handler to prevent duplicates during hot-reloading
	ipcMain.removeHandler(eventName);

	ipcMain.handle(
		eventName,
		async (
			event: Electron.IpcMainInvokeEvent,
			...args: HandlerArgs
		): Promise<HandlerOutput | { error: string }> => {
			try {
				return await handler(event, ...args);
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				console.error(
					`[IPC] Error in handler for '${eventName}':`,
					errorMessage,
				);
				return { error: errorMessage };
			}
		},
	);
}

const handleCheckForUpdate = async () => {
	await updater.checkForUpdates();
	return { success: true };
};

/**
 * Triggers the download of an available update.
 */
const handleDownloadUpdate = async () => {
	await updater.downloadUpdate();
	return { success: true };
};

/**
 * Triggers the installation of a downloaded update.
 * This will cause the application to quit and restart.
 * The frontend will not receive a response.
 */
const handleInstallUpdate = () => {
	updater.installUpdate();
};

/**
 * Gets the current status of the updater.
 */
const handleGetStatus = (): { status: UpdateStatus } => {
	return { status: updater.getStatus() };
};

// --- Register All Updater Event Handlers ---

console.log("[IPC] Initializing Updater events...");
registerEvent("updater:check-for-update", handleCheckForUpdate);
registerEvent("updater:download-update", handleDownloadUpdate);
registerEvent("updater:install-update", handleInstallUpdate);
registerEvent("updater:get-status", handleGetStatus);

if (process.env.NODE_ENV === "development") {
	console.log("🛠️  [DevTools] Updater simulation handlers registered.");

	// This handler now triggers the REAL update check process.
	// electron-updater will use your dev-app-update.yml to find a release.
	ipcMain.on("dev:trigger-real-update-check", async () => {
		console.log("[DevTools] Triggering a real update check...");
		try {
			// This calls the actual checkForUpdates method on your Updater instance
			await updater.checkForUpdates();
		} catch (error) {
			console.error("[DevTools] Error during simulated check:", error);
		}
	});

	// This handler is still useful for testing UI error states.
	ipcMain.on("dev:simulate-error", () => {
		console.log("🛠️  [DevTools] Simulating 'error' event...");
		// Manually set the status and emit the event for UI testing
		updater.setStatus(UpdateStatus.ERROR);
		emitToFrontend("updater:error", "This is a simulated update error.");
	});
}
