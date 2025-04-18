import logger from "../../../handlers/logging";
import { registerEvent } from "../utils/registerEvent";

const clear = async (_event: Electron.IpcMainInvokeEvent) => {
  try {
    return await logger.clear();
  } catch (error) {
    console.error(error);
    return false;
  }
};

registerEvent("logger:clear", clear);
