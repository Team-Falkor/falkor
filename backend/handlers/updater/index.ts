import { app } from "electron";
import electronUpdater from "electron-updater";
import { settings } from "../../utils/settings/settings";
import window from "../../utils/window";

const { autoUpdater } = electronUpdater;

autoUpdater.setFeedURL({
  provider: "github",
  owner: "team-falkor",
  repo: "app",
});

autoUpdater.allowDowngrade = true;
autoUpdater.autoInstallOnAppQuit = false;
autoUpdater.autoDownload = false;
autoUpdater.forceDevUpdateConfig = true;
autoUpdater.fullChangelog = false;

class Updater {
  private settings = settings;
  public updateAvailable = false;

  constructor() {
    autoUpdater.on("update-available", (info) => {
      this.updateAvailable = true;

      if (info.version <= app.getVersion()) return;

      // Extract release notes from GitHub release info
      const updateInfo = {
        ...info,
        releaseNotes: info.releaseNotes || "No changelog available",
      };

      window.emitToFrontend("updater:update-available", updateInfo);
    });
    autoUpdater.on("update-not-available", () => {
      this.updateAvailable = false;
    });
    autoUpdater.on("error", (error) => {
      console.error("Error checking for updates: ", error);
    });
    autoUpdater.on("checking-for-update", () => {
      console.log("Checking for updates...");
    });
    autoUpdater.on("update-downloaded", () => {
      console.log("Update downloaded.");
      this.updateAvailable = false;
    });
    autoUpdater.on("download-progress", (progressObj) => {
      console.log("Download progress: ", progressObj);

      window.emitToFrontend("updater:download-progress", progressObj.percent);
    });

    autoUpdater.on("update-downloaded", () => {
      autoUpdater.quitAndInstall();
    });

    autoUpdater.on("error", (error) => {
      window.emitToFrontend("updater:error", error);
    });
  }

  public async checkForUpdates() {
    if (!this.settings.get("autoCheckForUpdates")) return null;
    const check = await autoUpdater.checkForUpdates();

    if (!check) return false;

    if (check?.updateInfo?.version <= app.getVersion()) return false;

    console.log(`App version: ${app.getVersion()}`);
    console.log(`Update version: ${check?.updateInfo?.version}`);

    return true;
  }

  public async downloadUpdate() {
    const updateAvailable = await this.checkForUpdates();
    if (!updateAvailable) return false;
    return await autoUpdater.downloadUpdate();
  }

  public async update() {
    try {
      const check = await autoUpdater.checkForUpdatesAndNotify();
      if (!check) return false;
      if (check?.updateInfo?.version <= app.getVersion()) return false;

      await autoUpdater.downloadUpdate();
    } catch (error) {
      console.error("Error updating app: ", error);
    }
  }
}

export default new Updater();
