import { IpcMainInvokeEvent } from "electron";
import { downloadQueue } from "../../../handlers/download-queue";
import { registerEvent } from "../utils";

const stopDownload = async (
  _event: IpcMainInvokeEvent,
  id: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const result = await downloadQueue.stop(id);
    return { success: result };
  } catch (error) {
    console.error(`[Queue:Stop] Error stopping download ${id}:`, error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};

registerEvent("queue:stop", stopDownload);
