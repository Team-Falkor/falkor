import { logger } from "../../logging";
import { registerEvent } from "../utils/registerEvent";

const handler = async (
  _event: Electron.IpcMainInvokeEvent,
  includeTime?: boolean
) => {
  try {
    return logger.getLoggedDates(includeTime);
  } catch (error) {
    console.error(error);
    return [];
  }
};

registerEvent("logger:get-logged-dates", handler);
