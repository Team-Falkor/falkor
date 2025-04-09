import { DownloadData } from "@/@types";
import { ITorrent } from "@/@types/torrent";
import { IpcMainInvokeEvent } from "electron";
import { downloadQueue } from "../../../handlers/download-queue";
import { registerEvent } from "../utils";

const getActiveDownloads = async (
  _event: IpcMainInvokeEvent
): Promise<{
  success: boolean;
  data?: Array<ITorrent | DownloadData>;
  error?: string;
}> => {
  try {
    const downloads = await downloadQueue.getDownloads();
    return { success: true, data: downloads };
  } catch (error) {
    console.error("[Queue:GetDownloads] Error getting active downloads:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};

registerEvent("queue:getDownloads", getActiveDownloads);
