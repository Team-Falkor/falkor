import { app, ipcMain } from "electron";
import logger from "../../../handlers/logging";

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
  options: { silent?: boolean } = {}
): void {
  // Validate event name
  if (!eventName || typeof eventName !== "string") {
    throw new Error("Event name must be a non-empty string");
  }

  // Log registration unless silent option is enabled
  if (!app.isPackaged && !options.silent) {
    logger.log("info", `[EVENT] registering: ${eventName}`);
  }

  // Remove any existing handler to prevent duplicates
  try {
    ipcMain.removeHandler(eventName);
  } catch (error) {
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
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.log("error", `[EVENT] Error in handler for ${eventName}: ${errorMessage}`);
        return { error: errorMessage } as any;
      }
    }
  );
}

/**
 * Unregisters an event handler from IPC Main.
 *
 * @param eventName The name of the event to unregister.
 */
export function unregisterEvent(eventName: string): void {
  if (!eventName || typeof eventName !== "string") {
    throw new Error("Event name must be a non-empty string");
  }
  
  try {
    ipcMain.removeHandler(eventName);
    if (!app.isPackaged) {
      logger.log("info", `[EVENT] unregistered: ${eventName}`);
    }
  } catch (error) {
    logger.log("error", `[EVENT] Failed to unregister event ${eventName}: ${error}`);
  }
}
