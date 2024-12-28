import { IpcMainInvokeEvent } from "electron";
import { registerEvent } from "../utils";

import { downloadQueue } from "../../../utils/download-queue";

const stopAllDownloads = async (_event: IpcMainInvokeEvent) => {
  try {
    await downloadQueue.stopAll();
    return { success: true };
  } catch (error) {
    console.error("Error stopping all downloads:", error);
    return { success: false, error: (error as Error).message };
  }
};

registerEvent("queue:stopAll", stopAllDownloads);
