import { LoggerFilterOptions } from "@/@types/logs";
import logger from "../../../handlers/logging";
import { registerEvent } from "../utils/registerEvent";

const handler = async (
  _event: Electron.IpcMainInvokeEvent,
  options: LoggerFilterOptions
) => {
  try {
    return logger.filter(options);
  } catch (error) {
    console.error(error);
    return [];
  }
};

registerEvent("logger:filter", handler);
