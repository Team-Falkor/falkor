import type { IpcMainInvokeEvent } from "electron";
import { torrentClient } from "../../../handlers/torrent";
import { settings } from "../../../utils/settings/settings";
import { registerEvent } from "../utils";

// Event handler for pausing a torrent
const throttleUpload = async (
  _event: IpcMainInvokeEvent,
  rate: number,
  updateSettings: boolean = false
) => {
  try {
    torrentClient.throttleUpload(rate);

    if (updateSettings) settings.update("maxUploadSpeed", rate);

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

registerEvent("torrent:throttle-upload", throttleUpload);
