import fs from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getSoundPath } from "./utils";

const __dirname = dirname(fileURLToPath(import.meta.url));

const appDataPath = join(homedir(), "moe.falkor");
const downloadsPath = join(homedir(), "Downloads");
const settingsPath = join(appDataPath, "settings.json");
const cachePath = join(appDataPath, "cache");
const logsPath = join(appDataPath, "logs.json");

const migrationPath = import.meta.env.DEV
	? "resources/database/migrations"
	: join(__dirname, "../../resources/database/migrations");

if (!fs.existsSync(appDataPath)) {
	fs.mkdirSync(appDataPath);
}

if (!fs.existsSync(downloadsPath)) {
	fs.mkdirSync(downloadsPath);
}

if (!fs.existsSync(cachePath)) {
	fs.mkdirSync(cachePath);
}

if (!fs.existsSync(logsPath)) {
	fs.mkdirSync(logsPath, { recursive: true });
}

export const constants = {
	databasePath: join(appDataPath, "database.sqlite"),
	pluginsPath: join(appDataPath, "plugins"),
	themesPath: join(appDataPath, "themes"),
	screenshotsPath: join(appDataPath, "screenshots"),
	logsPath,
	cachePath,
	appDataPath,
	settingsPath,
	downloadsPath,
	migrationPath,
	apiUrl: process.env.FALKOR_API_BASE_URL,
	assets: {
		sounds: {
			complete: getSoundPath("complete.wav"),
		},
	},
};
