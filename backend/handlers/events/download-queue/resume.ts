import { IpcMainInvokeEvent } from "electron";
import { downloadQueue } from "../../../utils/download-queue";
import { registerEvent } from "../utils";

const resumeDownload = async (_event: IpcMainInvokeEvent, id: string) => {
  try {
    await downloadQueue.resume(id);
    return { success: true };
  } catch (error) {
    console.error(`Error resuming download with ID ${id}:`, error);
    return { success: false, error: (error as Error).message };
  }
};

registerEvent("queue:resume", resumeDownload);
