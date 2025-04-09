import { IpcMainInvokeEvent } from "electron";
import { downloadQueue } from "../../../handlers/download-queue";
import { registerEvent } from "../utils";

const pauseDownload = async (
  _event: IpcMainInvokeEvent,
  id: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const result = await downloadQueue.pause(id);
    return { success: result };
  } catch (error) {
    console.error(`[Queue:Pause] Error pausing download ${id}:`, error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};

registerEvent("queue:pause", pauseDownload);
