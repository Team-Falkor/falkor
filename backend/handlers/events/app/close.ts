import { downloadQueue } from "../../../handlers/download";
import { gamesLaunched } from "../../../handlers/launcher/games_launched";
import { settings } from "../../../utils/settings/settings";
import window from "../../../utils/window";
import { registerEvent } from "../utils/registerEvent";

const close = async (
  _event: Electron.IpcMainInvokeEvent,
  confirmed?: boolean
) => {
  try {
    if (!window?.window) return;
    const closeToTray = settings.get("closeToTray");

    if (closeToTray) {
      window?.window?.hide();
      return;
    }

    if (gamesLaunched.size > 0 && !confirmed) {
      window.emitToFrontend("close-confirm", { message: "game's running" });
      return;
    }

    if ((await downloadQueue.getDownloads())?.length > 0 && !confirmed) {
      window.emitToFrontend("close-confirm", {
        message: "download's not finished",
      });
      return;
    }

    window?.window?.close();
  } catch (error) {
    console.error(error);
    return false;
  }
};

registerEvent("app:close", close);
