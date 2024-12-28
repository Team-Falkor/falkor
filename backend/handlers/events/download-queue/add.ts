import { QueueData } from "@/@types";

import { IpcMainInvokeEvent } from "electron";
import { downloadQueue } from "../../../utils/download-queue";
import { registerEvent } from "../utils";

const addQueueItem = async (_event: IpcMainInvokeEvent, item: QueueData) => {
  try {
    await downloadQueue.add(item);
    return { success: true };
  } catch (error) {
    console.error("Error adding to queue:", error);
    return { success: false, error: (error as Error).message };
  }
};

registerEvent("queue:add", addQueueItem);
