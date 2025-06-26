import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { app } from "electron";
import type { Cracker } from "@/@types";
import type { AchievementFile } from "@/@types/achievements/types";
import logger from "../logging";

type PathType =
	| "appData"
	| "documents"
	| "publicDocuments"
	| "localAppData"
	| "programData"
	| "winePrefix";

interface FilePath {
	achievement_folder_location: string;
	achievement_file_location: string[];
}

class AchievementFileLocator {
	private constructor() {}

	private static isWindows = process.platform === "win32";
	private static user = this.isWindows
		? undefined
		: app.getPath("home").split("/").pop();

	private static winePrefix =
		process.env.WINEPREFIX || join(app.getPath("home"), ".wine");

	private static validateWinePrefix(): void {
		if (!existsSync(AchievementFileLocator.winePrefix)) {
			logger.log(
				"warn",
				`Wine prefix not found at ${AchievementFileLocator.winePrefix}. Check WINEPREFIX environment variable.`,
			);
		}
	}

	private static readonly crackerPaths: Readonly<Record<Cracker, FilePath[]>> =
		Object.freeze({
			codex: [
				{
					achievement_folder_location: join(
						this.getSystemPath("publicDocuments"),
						"Steam",
						"CODEX",
					),
					achievement_file_location: ["<game_store_id>", "achievements.ini"],
				},
				{
					achievement_folder_location: join(
						this.getSystemPath("appData"),
						"Steam",
						"CODEX",
					),
					achievement_file_location: ["<game_store_id>", "achievements.ini"],
				},
			],
			rune: [
				{
					achievement_folder_location: join(
						this.getSystemPath("publicDocuments"),
						"Steam",
						"RUNE",
					),
					achievement_file_location: ["<game_store_id>", "achievements.ini"],
				},
			],
			onlinefix: [
				{
					achievement_folder_location: join(
						this.getSystemPath("publicDocuments"),
						"OnlineFix",
					),
					achievement_file_location: [
						"<game_store_id>",
						"Stats",
						"Achievements.ini",
					],
				},
				{
					achievement_folder_location: join(
						this.getSystemPath("publicDocuments"),
						"OnlineFix",
					),
					achievement_file_location: ["<game_store_id>", "Achievements.ini"],
				},
			],
			goldberg: [
				{
					achievement_folder_location: join(
						this.getSystemPath("appData"),
						"Goldberg SteamEmu Saves",
					),
					achievement_file_location: ["<game_store_id>", "achievements.json"],
				},
				{
					achievement_folder_location: join(
						this.getSystemPath("appData"),
						"GSE Saves",
					),
					achievement_file_location: ["<game_store_id>", "achievements.json"],
				},
			],
			rld: [
				{
					achievement_folder_location: join(
						this.getSystemPath("programData"),
						"RLD!",
					),
					achievement_file_location: ["<game_store_id>", "achievements.ini"],
				},
				{
					achievement_folder_location: join(
						this.getSystemPath("programData"),
						"Steam",
						"Player",
					),
					achievement_file_location: [
						"<game_store_id>",
						"stats",
						"achievements.ini",
					],
				},
				{
					achievement_folder_location: join(
						this.getSystemPath("programData"),
						"Steam",
						"RLD!",
					),
					achievement_file_location: [
						"<game_store_id>",
						"stats",
						"achievements.ini",
					],
				},
				{
					achievement_folder_location: join(
						this.getSystemPath("programData"),
						"Steam",
						"dodi",
					),
					achievement_file_location: [
						"<game_store_id>",
						"stats",
						"achievements.ini",
					],
				},
			],
			empress: [
				{
					achievement_folder_location: join(
						this.getSystemPath("appData"),
						"EMPRESS",
						"remote",
					),
					achievement_file_location: ["<game_store_id>", "achievements.json"],
				},
				{
					achievement_folder_location: join(
						this.getSystemPath("publicDocuments"),
						"EMPRESS",
					),
					achievement_file_location: [
						"<game_store_id>",
						"remote",
						"<game_store_id>",
						"achievements.json",
					],
				},
			],
			skidrow: [
				{
					achievement_folder_location: join(
						this.getSystemPath("documents"),
						"SKIDROW",
					),
					achievement_file_location: [
						"<game_store_id>",
						"SteamEmu",
						"UserStats",
						"achiev.ini",
					],
				},
				{
					achievement_folder_location: join(
						this.getSystemPath("documents"),
						"Player",
					),
					achievement_file_location: [
						"<game_store_id>",
						"SteamEmu",
						"UserStats",
						"achiev.ini",
					],
				},
				{
					achievement_folder_location: join(
						this.getSystemPath("localAppData"),
						"SKIDROW",
					),
					achievement_file_location: [
						"<game_store_id>",
						"SteamEmu",
						"UserStats",
						"achiev.ini",
					],
				},
			],
			creamapi: [
				{
					achievement_folder_location: join(
						this.getSystemPath("appData"),
						"CreamAPI",
					),
					achievement_file_location: [
						"<game_store_id>",
						"stats",
						"CreamAPI.Achievements.cfg",
					],
				},
			],
			smartsteamemu: [
				{
					achievement_folder_location: join(
						this.getSystemPath("appData"),
						"SmartSteamEmu",
					),
					achievement_file_location: [
						"<game_store_id>",
						"User",
						"Achievements.ini",
					],
				},
			],
			_3dm: [],
			flt: [],
			rle: [
				{
					achievement_folder_location: join(
						this.getSystemPath("appData"),
						"RLE",
					),
					achievement_file_location: ["<game_store_id>", "achievements.ini"],
				},
				{
					achievement_folder_location: join(
						this.getSystemPath("appData"),
						"RLE",
					),
					achievement_file_location: ["<game_store_id>", "Achievements.ini"],
				},
			],
			razor1911: [
				{
					achievement_folder_location: join(
						this.getSystemPath("appData"),
						".1911",
					),
					achievement_file_location: ["<game_store_id>", "achievement"],
				},
			],
		});

	private static getSystemPath(type: PathType): string {
		if (AchievementFileLocator.isWindows) {
			switch (type) {
				case "documents":
					return app.getPath("documents");
				case "publicDocuments":
					return join("C:", "Users", "Public", "Documents");
				case "localAppData":
					return join(app.getPath("appData"), "..", "Local");
				case "programData":
					return join("C:", "ProgramData");
				case "appData":
					return app.getPath("appData");
				case "winePrefix":
					return "";
				default:
					throw new Error(`Invalid path type: ${type}`);
			}
		}
		// Linux path handling
		const homeDir = app.getPath("home");
		// Use XDG base directory for Linux systems
		const xdgData =
			process.env.XDG_DATA_HOME || join(homeDir, ".local", "share");
		const wineDataPath = join(xdgData, "wine");

		switch (type) {
			case "documents":
				return join(homeDir, "Documents");
			case "publicDocuments":
				return join(wineDataPath, "drive_c", "users", "Public", "Documents");
			case "localAppData":
				return join(
					wineDataPath,
					"drive_c",
					"users",
					AchievementFileLocator.user || "unknown",
					"AppData",
					"Local",
				);
			case "programData":
				return join(wineDataPath, "drive_c", "ProgramData");
			case "appData":
				return join(
					wineDataPath,
					"drive_c",
					"users",
					AchievementFileLocator.user || "unknown",
					"AppData",
					"Roaming",
				);
			case "winePrefix":
				return wineDataPath;
			default:
				throw new Error(`Invalid path type: ${type}`);
		}
	}

	static setWinePrefix(newPrefix: string): void {
		if (!existsSync(newPrefix)) {
			throw new Error(`Specified Wine prefix does not exist: ${newPrefix}`);
		}
		AchievementFileLocator.winePrefix = newPrefix;
		AchievementFileLocator.validateWinePrefix();
	}

	static findAllAchievementFiles(
		winePrefix?: string | null,
	): Map<string, AchievementFile[]> {
		if (winePrefix) AchievementFileLocator.setWinePrefix(winePrefix);

		const gameAchievementFiles = new Map<string, AchievementFile[]>();

		for (const [cracker, paths] of Object.entries(
			AchievementFileLocator.crackerPaths,
		) as [Cracker, FilePath[]][]) {
			paths.forEach(
				({ achievement_folder_location, achievement_file_location }) => {
					if (!existsSync(achievement_folder_location)) {
						logger.log(
							"debug",
							`Folder not found: ${achievement_folder_location}`,
						);
						return;
					}

					logger.log(
						"debug",
						`Processing folder: ${achievement_folder_location}`,
					);
					const gameStoreIds = readdirSync(achievement_folder_location);

					gameStoreIds.forEach((gameStoreId) => {
						const filePath = AchievementFileLocator.buildFilePath(
							achievement_folder_location,
							achievement_file_location,
							gameStoreId,
						);

						if (!existsSync(filePath)) {
							return;
						}

						const achievementFile: AchievementFile = {
							cracker,
							path: filePath,
						};

						const existingFiles = gameAchievementFiles.get(gameStoreId) || [];
						gameAchievementFiles.set(gameStoreId, [
							...existingFiles,
							achievementFile,
						]);
					});
				},
			);
		}

		return gameAchievementFiles;
	}

	private static buildFilePath(
		folderPath: string,
		fileLocations: string[],
		gameStoreId: string,
	): string {
		const mappedLocations = fileLocations.map((location) =>
			location.replace(/<game_store_id>/g, gameStoreId),
		);
		return join(folderPath, ...mappedLocations);
	}

	static findAchievementFiles(
		gameStoreId: string,
		winePrefix?: string | null,
	): AchievementFile[] {
		try {
			const gameAchievementFiles =
				AchievementFileLocator.findAllAchievementFiles(winePrefix);
			return gameAchievementFiles.get(gameStoreId) || [];
		} catch (error) {
			console.error(error);
			logger.log("error", `Error finding achievement files: ${error}`);
			throw error;
		}
	}
}

export { AchievementFileLocator };
