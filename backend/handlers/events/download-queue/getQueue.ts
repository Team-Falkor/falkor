import { QueueData } from "@/@types";
import { IpcMainInvokeEvent } from "electron";
import { downloadQueue } from "../../../utils/download-queue";
import { registerEvent } from "../utils";

const getQueueItems = (
  _event: IpcMainInvokeEvent
): {
  success: boolean;
  data?: QueueData[];
  error?: string;
} => {
  try {
    const items = downloadQueue.getQueueItems();
    return { success: true, data: items };
  } catch (error) {
    console.error("Error fetching queue items:", error);
    return { success: false, error: (error as Error).message };
  }
};

registerEvent("queue:getQueueItems", getQueueItems);
