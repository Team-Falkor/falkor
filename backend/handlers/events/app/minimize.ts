import window from "../../../utils/window";
import { registerEvent } from "../utils/registerEvent";


const minimize = async (_event: Electron.IpcMainInvokeEvent) => {
  try {
    const w = window.getWindow();
    if (!w) return;
    w?.minimize();
  } catch (error) {
    console.error(error);
    return false;
  }
};

registerEvent("app:minimize", minimize);
