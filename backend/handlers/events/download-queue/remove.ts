import { IpcMainInvokeEvent } from "electron";
import { downloadQueue } from "../../../handlers/download-queue";
import { registerEvent } from "../utils";

const removeDownload = async (
  _event: IpcMainInvokeEvent,
  id: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // For now, removing a download is the same as stopping it
    const result = await downloadQueue.stop(id);
    return { success: result };
  } catch (error) {
    console.error(`[Queue:Remove] Error removing download ${id}:`, error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};

registerEvent("queue:remove", removeDownload);
