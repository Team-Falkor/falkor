import fs from "fs";
import { join } from "node:path";
import { homedir } from "os";
import { getSoundPath } from "./utils";

const appDataPath = join(homedir(), "moe.falkor");
const downloadsPath = join(homedir(), "Downloads");
const settingsPath = join(appDataPath, "settings.json");
const cachePath = join(appDataPath, "cache");

if (!fs.existsSync(appDataPath)) {
  fs.mkdirSync(appDataPath);
}

if (!fs.existsSync(downloadsPath)) {
  fs.mkdirSync(downloadsPath);
}

if (!fs.existsSync(cachePath)) {
  fs.mkdirSync(cachePath);
}

export const constants = {
  databasePath: join(appDataPath, "database.sqlite"),
  pluginsPath: join(appDataPath, "plugins"),
  themesPath: join(appDataPath, "themes"),
  screenshotsPath: join(appDataPath, "screenshots"),
  logsPath: join(appDataPath, "logs.json"),
  cachePath,
  appDataPath,
  settingsPath,
  downloadsPath,
  apiUrl: process.env.FALKOR_API_BASE_URL,
  assets: {
    sounds: {
      complete: getSoundPath("complete.wav"),
    },
  },
};
