import { QueueData } from "@/@types";
import { IpcMainInvokeEvent } from "electron";
import { downloadQueue } from "../../../handlers/download-queue";
import { registerEvent } from "../utils";

const getQueueItems = async (
  _event: IpcMainInvokeEvent
): Promise<{
  success: boolean;
  data?: QueueData[];
  error?: string;
}> => {
  try {
    const queue = await downloadQueue.getQueue();
    return { success: true, data: queue };
  } catch (error) {
    console.error("[Queue:GetQueue] Error getting queue items:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};

registerEvent("queue:getQueueItems", getQueueItems);
