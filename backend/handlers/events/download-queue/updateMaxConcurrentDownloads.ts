import { IpcMainInvokeEvent } from "electron";
import { downloadQueue } from "../../../handlers/download-queue";
import { registerEvent } from "../utils";

const updateMaxConcurrentDownloads = async (
  _event: IpcMainInvokeEvent,
  max: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    downloadQueue.updateMaxConcurrentDownloads(max);
    return { success: true };
  } catch (error) {
    console.error("[Queue:UpdateMaxConcurrentDownloads] Error updating max concurrent downloads:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};

registerEvent("queue:updateMaxConcurrentDownloads", updateMaxConcurrentDownloads);
