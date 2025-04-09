import { QueueData } from "@/@types";
import { IpcMainInvokeEvent } from "electron";
import { downloadQueue } from "../../../handlers/download-queue";
import { registerEvent } from "../utils";

const addQueueItem = async (
  _event: IpcMainInvokeEvent,
  item: QueueData
): Promise<{ success: boolean; error?: string }> => {
  try {
    const result = await downloadQueue.add(item);
    return { success: result };
  } catch (error) {
    console.error("[Queue:Add] Error adding item to queue:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};

registerEvent("queue:add", addQueueItem);
