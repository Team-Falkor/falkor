import type { IpcMainInvokeEvent } from "electron";
import { torrentClient } from "../../../handlers/torrent";
import { settings } from "../../../utils/settings/settings";
import { registerEvent } from "../utils";

// Event handler for pausing a torrent
const throttleDownload = async (
  _event: IpcMainInvokeEvent,
  rate: number,
  updateSettings: boolean = false
) => {
  try {
    torrentClient.throttleDownload(rate);

    if (updateSettings) settings.update("maxDownloadSpeed", rate);

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

registerEvent("torrent:throttle-download", throttleDownload);
