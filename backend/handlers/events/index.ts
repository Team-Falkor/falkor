import { app } from "electron";
import "./app";
import "./db";
import "./download-queue";
import "./generic";
import "./launcher";
import "./logger";
import "./plugins";
import "./settings";
import "./themes";
import "./torrent";
import "./updater";

if (process.platform === "win32") {
  app.setAppUserModelId(app.name);
}
