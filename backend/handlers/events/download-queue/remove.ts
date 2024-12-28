import { IpcMainInvokeEvent } from "electron";
import { registerEvent } from "../utils";

import { downloadQueue } from "../../../utils/download-queue";

const removeQueueItem = async (_event: IpcMainInvokeEvent, id: string) => {
  try {
    await downloadQueue.remove(id);
    return { success: true };
  } catch (error) {
    console.error("Error removing from queue:", error);
    return { success: false, error: (error as Error).message };
  }
};

registerEvent("queue:remove", removeQueueItem);
