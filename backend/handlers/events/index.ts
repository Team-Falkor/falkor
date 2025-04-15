import { app } from "electron";
import "./achievements";
import "./app";
import "./db";
import "./downloads";
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
