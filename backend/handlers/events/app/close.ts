import { gamesLaunched } from "../../../handlers/launcher/games_launched";
import { settings } from "../../../utils/settings/settings";
import window from "../../../utils/window";
import { registerEvent } from "../utils/registerEvent";

const close = async (
  _event: Electron.IpcMainInvokeEvent,
  confirmed?: boolean
) => {
  try {
    const w = window.getWindow();
    if (!w) return;
    const closeToTray = settings.get("closeToTray");

    if (closeToTray) {
      w?.hide();
      return;
    }

    if (gamesLaunched.size > 0 && !confirmed) {
      window.emitToFrontend("close-confirm", { message: "game's running" });
      return;
    }

    w?.close();
  } catch (error) {
    console.error(error);
    return false;
  }
};

registerEvent("app:close", close);
