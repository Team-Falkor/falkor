import { IpcMainInvokeEvent } from "electron";
import { downloadQueue } from "../../../handlers/download-queue";
import { registerEvent } from "../utils";

const stopAllDownloads = async (
  _event: IpcMainInvokeEvent
): Promise<{ success: boolean; error?: string }> => {
  try {
    const result = await downloadQueue.stopAll();
    return { success: result };
  } catch (error) {
    console.error("[Queue:StopAll] Error stopping all downloads:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};

registerEvent("queue:stopAll", stopAllDownloads);
