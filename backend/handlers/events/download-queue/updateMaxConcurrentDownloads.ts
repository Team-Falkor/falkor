import { IpcMainInvokeEvent } from "electron";
import { downloadQueue } from "../../../utils/download-queue";
import { registerEvent } from "../utils";

const updateMaxConcurrentDownloads = async (
  _event: IpcMainInvokeEvent,
  max: number
) => {
  try {
    downloadQueue.updateMaxConcurrentDownloads(max);
    return { success: true, data: max };
  } catch (error) {
    console.error("Error updating max concurrent downloads:", error);
    return { success: false, error: (error as Error).message };
  }
};

registerEvent(
  "queue:updateMaxConcurrentDownloads",
  updateMaxConcurrentDownloads
);
