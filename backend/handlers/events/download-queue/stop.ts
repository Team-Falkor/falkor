import { IpcMainInvokeEvent } from "electron";
import { registerEvent } from "../utils";

import { downloadQueue } from "../../../utils/download-queue";

const stopDownload = async (_event: IpcMainInvokeEvent, id: string) => {
  try {
    await downloadQueue.stop(id);
    return { success: true };
  } catch (error) {
    console.error(`Error stopping download with ID ${id}:`, error);
    return { success: false, error: (error as Error).message };
  }
};

registerEvent("queue:stop", stopDownload);
