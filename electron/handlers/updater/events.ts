import { app, ipcMain } from "electron";
import updater from ".";

/**
 * Registers an event handler with IPC Main.
 *
 * @param eventName The name of the event to handle.
 * @param handler The function to call when the event is received.
 * @param options Additional options for event registration
 * @returns void
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
	// Validate event name
	if (!eventName || typeof eventName !== "string") {
		throw new Error("Event name must be a non-empty string");
	}

	// Log registration unless silent option is enabled
	if (!app.isPackaged && !options.silent) {
		console.log("info", `[EVENT] registering: ${eventName}`);
	}

	// Remove any existing handler to prevent duplicates
	try {
		ipcMain.removeHandler(eventName);
	} catch {
		// Ignore errors when removing non-existent handlers
	}

	// Register the new handler with error handling
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
				console.log(
					"error",
					`[EVENT] Error in handler for ${eventName}: ${errorMessage}`,
				);
				return { error: errorMessage };
			}
		},
	);
}

const checkForUpdate = async (_event: Electron.IpcMainInvokeEvent) => {
	console.log("Checking for update...");
	try {
		const check = await updater.checkForUpdates();

		return { success: true, data: check };
	} catch (error) {
		console.error("Error checking for updates:", error);
		return { success: false, error };
	}
};

const installUpdate = async (_event: Electron.IpcMainInvokeEvent) => {
	console.log("Installing update...");
	try {
		updater.installUpdate();
		return { success: true };
	} catch (error) {
		console.error("Error installing update: ", error);
		return { success: false, error };
	}
};

// Register the event handler
registerEvent("updater:check-for-update", checkForUpdate);
registerEvent("updater:install", installUpdate);
