import { LogEntry } from "@/@types/logs";
import logger from "../../../handlers/logging";
import { registerEvent } from "../utils/registerEvent";

const log = (
  _event: Electron.IpcMainInvokeEvent,
  level: LogEntry["level"],
  message: string
): ReturnType<typeof logger.log> => {
  try {
    return logger.log(level, message);
  } catch (error) {
    console.error(error);
    return null;
  }
};

registerEvent("logger:log", log);
