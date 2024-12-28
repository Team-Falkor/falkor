import { DownloadData } from "@/@types";
import { ITorrent } from "@/@types/torrent";
import { IpcMainInvokeEvent } from "electron";
import { downloadQueue } from "../../../utils/download-queue";
import { registerEvent } from "../utils";

const getActiveDownloads = async (
  _event: IpcMainInvokeEvent
): Promise<{
  success: boolean;
  data?: Array<ITorrent | DownloadData>;
  error?: string;
}> => {
  try {
    const downloads = downloadQueue.getDownloads();

    return { success: true, data: downloads };
  } catch (error) {
    console.error("Error fetching downloads:", error);
    return { success: false, error: (error as Error).message };
  }
};

registerEvent("queue:getDownloads", getActiveDownloads);
