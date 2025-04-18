import logger from "../../../handlers/logging";
import { registerEvent } from "../utils/registerEvent";

const deleteALog = async (
  _event: Electron.IpcMainInvokeEvent,
  timestamp: number
) => {
  try {
    return logger.remove(timestamp);
  } catch (error) {
    console.error(error);
    return false;
  }
};

registerEvent("logger:delete", deleteALog);
