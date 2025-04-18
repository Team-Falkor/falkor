import window from "../../../utils/window";
import { registerEvent } from "../utils/registerEvent";


const maximize = async (_event: Electron.IpcMainInvokeEvent) => {
  try {
    const w = window.getWindow();
    if (!w) return;

    if (w.isMaximized()) {
      w?.unmaximize();
    } else {
      w?.maximize();
    }
  } catch (error) {
    console.error(error);
    return false;
  }
};

registerEvent("app:maximize", maximize);
