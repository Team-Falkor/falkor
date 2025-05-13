import fs from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Sound } from "@/@types";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Define resourcesPath for both dev and production environments
const resourcesPath = import.meta.env.DEV
	? join(__dirname, "../", "../", "resources")
	: join(process.resourcesPath, "resources");

const appDataPath = join(homedir(), "moe.falkor");
const downloadsPath = join(homedir(), "Downloads");
const settingsPath = join(appDataPath, "settings.json");
const cachePath = join(appDataPath, "cache");
const logsPath = join(appDataPath, "logs.json");
const soundPath = join(resourcesPath, "sounds");

const migrationPath = join(resourcesPath, "database/migrations");

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
	resourcesPath,
	apiUrl: process.env.FALKOR_API_BASE_URL,
	assets: {
		sounds: {
			[Sound.Complete]: join(soundPath, "complete.wav"),
			[Sound.AchievementUnlocked]: join(soundPath, "achievement_unlock.wav"),
		},
	},
};
