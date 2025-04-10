import { UpdateInfoWithReleaseNotes } from "@/@types";
import { useUpdaterStore } from "@/stores/updater";
import { useEffect } from "react";
import { useSettings } from "./useSettings";

export const useUpdater = (check: boolean = true) => {
  const {
    updateAvailable,
    checkForUpdates,
    installUpdate,
    progress,
    setUpdateAvailable,
    setUpdateInfo,
    updateInfo,
  } = useUpdaterStore();
  const { settings } = useSettings();

  useEffect(() => {
    // if (settings.autoCheckForUpdates && check) {
    checkForUpdates();
    // }
  }, [check, checkForUpdates, settings.autoCheckForUpdates]);

  useEffect(() => {
    window.ipcRenderer.once(
      "updater:update-available",
      (_event, info: UpdateInfoWithReleaseNotes) => {
        setUpdateAvailable(true);
        setUpdateInfo(info);
        window.ipcRenderer.removeAllListeners("updater:update-available");
      }
    );
    return () => {
      window.ipcRenderer.removeAllListeners("updater:update-available");
    };
  }, [setUpdateAvailable, setUpdateInfo]);

  return {
    updateAvailable,
    checkForUpdates,
    installUpdate,
    progress,
    updateInfo,
    setUpdateAvailable,
    setUpdateInfo,
  };
};
