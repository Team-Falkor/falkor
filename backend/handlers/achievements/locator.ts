import { Cracker } from "@/@types";
import { AchievementFile } from "@/@types/achievements/types";
import { app } from "electron";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

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
  private static isWindows = process.platform === "win32";
  private static user = !this.isWindows
    ? app.getPath("home").split("/").pop()
    : undefined;

  private static readonly winePrefix =
    process.env.WINEPREFIX || join(app.getPath("home"), ".wine");

  private static readonly crackerPaths: Readonly<Record<Cracker, FilePath[]>> =
    Object.freeze({
      codex: [
        {
          achievement_folder_location: join(
            this.getSystemPath("publicDocuments"),
            "Steam",
            "CODEX"
          ),
          achievement_file_location: ["<game_store_id>", "achievements.ini"],
        },
        {
          achievement_folder_location: join(
            this.getSystemPath("appData"),
            "Steam",
            "CODEX"
          ),
          achievement_file_location: ["<game_store_id>", "achievements.ini"],
        },
      ],
      rune: [
        {
          achievement_folder_location: join(
            this.getSystemPath("publicDocuments"),
            "Steam",
            "RUNE"
          ),
          achievement_file_location: ["<game_store_id>", "achievements.ini"],
        },
      ],
      onlinefix: [
        {
          achievement_folder_location: join(
            this.getSystemPath("publicDocuments"),
            "OnlineFix"
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
            "OnlineFix"
          ),
          achievement_file_location: ["<game_store_id>", "Achievements.ini"],
        },
      ],
      goldberg: [
        {
          achievement_folder_location: join(
            this.getSystemPath("appData"),
            "Goldberg SteamEmu Saves"
          ),
          achievement_file_location: ["<game_store_id>", "achievements.json"],
        },
        {
          achievement_folder_location: join(
            this.getSystemPath("appData"),
            "GSE Saves"
          ),
          achievement_file_location: ["<game_store_id>", "achievements.json"],
        },
      ],
      rld: [
        {
          achievement_folder_location: join(
            this.getSystemPath("programData"),
            "RLD!"
          ),
          achievement_file_location: ["<game_store_id>", "achievements.ini"],
        },
        {
          achievement_folder_location: join(
            this.getSystemPath("programData"),
            "Steam",
            "Player"
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
            "RLD!"
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
            "dodi"
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
            "remote"
          ),
          achievement_file_location: ["<game_store_id>", "achievements.json"],
        },
        {
          achievement_folder_location: join(
            this.getSystemPath("publicDocuments"),
            "EMPRESS"
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
            "SKIDROW"
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
            "Player"
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
            "SKIDROW"
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
            "CreamAPI"
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
            "SmartSteamEmu"
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
            "RLE"
          ),
          achievement_file_location: ["<game_store_id>", "achievements.ini"],
        },
        {
          achievement_folder_location: join(
            this.getSystemPath("appData"),
            "RLE"
          ),
          achievement_file_location: ["<game_store_id>", "Achievements.ini"],
        },
      ],
      razor1911: [
        {
          achievement_folder_location: join(
            this.getSystemPath("appData"),
            ".1911"
          ),
          achievement_file_location: ["<game_store_id>", "achievement"],
        },
      ],
    });

  private static getSystemPath(type: PathType): string {
    const basePaths = {
      appData: this.isWindows
        ? app.getPath("appData")
        : join(
            this.winePrefix,
            "drive_c",
            "users",
            this.user || "",
            "AppData",
            "Roaming"
          ),
      documents: this.isWindows
        ? app.getPath("documents")
        : join(
            this.winePrefix,
            "drive_c",
            "users",
            this.user || "",
            "Documents"
          ),
      publicDocuments: this.isWindows
        ? join("C:", "Users", "Public", "Documents")
        : join(this.winePrefix, "drive_c", "users", "Public", "Documents"),
      localAppData: this.isWindows
        ? join(app.getPath("appData"), "..", "Local")
        : join(
            this.winePrefix,
            "drive_c",
            "users",
            this.user || "",
            "AppData",
            "Local"
          ),
      programData: this.isWindows
        ? join("C:", "ProgramData")
        : join(this.winePrefix, "drive_c", "ProgramData"),
      winePrefix: this.winePrefix,
    };

    return (
      basePaths[type] ||
      (() => {
        throw new Error(`Unknown path type: ${type}`);
      })()
    );
  }

  static getCrackerPath(cracker: Cracker): FilePath[] {
    return this.crackerPaths[cracker] || [];
  }

  private static replacePlaceholders(
    path: string,
    gameStoreId: string
  ): string {
    if (!gameStoreId) {
      throw new Error("Invalid gameStoreId provided");
    }
    return path.replace(/<game_store_id>/g, gameStoreId);
  }

  private static buildFilePath(
    folderPath: string,
    fileLocations: string[],
    gameStoreId: string
  ): string {
    const mappedLocations = fileLocations.map((location) =>
      this.replacePlaceholders(location, gameStoreId)
    );
    return join(folderPath, ...mappedLocations);
  }

  static findAllAchievementFiles(): Map<string, AchievementFile[]> {
    const gameAchievementFiles = new Map<string, AchievementFile[]>();
    console.log(`Searching for achievement files`);

    for (const [cracker, paths] of Object.entries(this.crackerPaths) as [
      Cracker,
      FilePath[],
    ][]) {
      paths.forEach(
        ({ achievement_folder_location, achievement_file_location }) => {
          if (!existsSync(achievement_folder_location)) return;

          console.log(`${achievement_folder_location}`);

          const gameStoreIds = readdirSync(achievement_folder_location);
          gameStoreIds.forEach((gameStoreId) => {
            const filePath = this.buildFilePath(
              achievement_folder_location,
              achievement_file_location,
              gameStoreId
            );

            if (!existsSync(filePath)) return;

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
        }
      );
    }

    return gameAchievementFiles;
  }

  static findAchievementFiles(gameStoreId: string): AchievementFile[] {
    const gameAchievementFiles = this.findAllAchievementFiles();
    return gameAchievementFiles.get(gameStoreId) || [];
  }
}

export { AchievementFileLocator };
