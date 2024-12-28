import { IpcMainInvokeEvent } from "electron";
import { registerEvent } from "../utils";

import { downloadQueue } from "../../../utils/download-queue";

const pauseDownload = async (_event: IpcMainInvokeEvent, id: string) => {
  try {
    await downloadQueue.pause(id);
    return { success: true };
  } catch (error) {
    console.error(`Error pausing download with ID ${id}:`, error);
    return { success: false, error: (error as Error).message };
  }
};

registerEvent("queue:pause", pauseDownload);
