import { Cracker, UnlockedAchievement } from "@/@types";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import logger from "../logging";

class AchievementParser {
  public parseAchievements(
    filePath: string,
    crackerType: Cracker
  ): UnlockedAchievement[] {
    if (!this.isPathValid(filePath)) return [];

    const parsers: Record<Cracker, () => UnlockedAchievement[]> = {
      codex: () => this.parseIniFile(filePath, this.handleGenericIniFormat),
      rune: () => this.parseIniFile(filePath, this.handleGenericIniFormat),
      onlinefix: () => this.parseIniFile(filePath, this.handleOnlineFixFormat),
      goldberg: () => this.parseJsonFile(filePath, this.handleGoldbergFormat),
      rld: () => this.parseIniFile(filePath, this.handleReloadedFormat),
      skidrow: () => this.parseIniFile(filePath, this.handleSkidrowFormat),
      _3dm: () => this.parseIniFile(filePath, this.handle3DMFormat),
      flt: () => this.processFlatFileAchievements(filePath),
      creamapi: () => this.parseIniFile(filePath, this.handleCreamAPIFormat),
      empress: () => this.parseJsonFile(filePath, this.handleGoldbergFormat),
      razor1911: () => this.processRazor1911Achievements(filePath),
      smartsteamemu: () => [],
      rle: () => [],
    };

    const parseFn = parsers[crackerType];
    if (!parseFn) {
      console.log(
        `Unsupported cracker type "${crackerType}" for achievements in file: ${filePath}`
      );
      logger.log("info", `Unsupported cracker type: ${crackerType}`);
      return [];
    }

    return parseFn();
  }

  private isPathValid(filePath: string): boolean {
    try {
      const resolvedPath = path.resolve(filePath);
      return existsSync(resolvedPath);
    } catch (err) {
      console.error(`Invalid file path: ${filePath}`, err);
      logger.log("error", `Invalid file path: ${filePath}`);
      return false;
    }
  }

  private parseIniFile(
    filePath: string,
    processor: (data: any) => UnlockedAchievement[]
  ): UnlockedAchievement[] {
    try {
      const fileContent = readFileSync(filePath, "utf-8");
      const iniData = this.parseIniContent(fileContent);
      return processor(iniData);
    } catch (err) {
      console.error(`Error parsing INI file: ${filePath}`, err);
      logger.log("error", `Error parsing INI file: ${err}`);
      return [];
    }
  }

  private parseJsonFile(
    filePath: string,
    processor: (data: any) => UnlockedAchievement[]
  ): UnlockedAchievement[] {
    try {
      const fileContent = readFileSync(filePath, "utf-8");
      const jsonData = JSON.parse(fileContent);
      return processor(jsonData);
    } catch (err) {
      console.error(`Error parsing JSON file: ${filePath}`, err);
      logger.log("error", `Error parsing JSON file: ${err}`);
      return [];
    }
  }

  private processFlatFileAchievements(filePath: string): UnlockedAchievement[] {
    try {
      const normalizedPath = path.normalize(filePath);
      const achievementFiles = readdirSync(normalizedPath);
      return achievementFiles.map((filename) => ({
        name: filename,
        unlockTime: Date.now(),
      }));
    } catch (err) {
      console.error(
        `Error processing achievements from flat files in: ${filePath}`,
        err
      );
      logger.log("error", `Error processing flat file achievements: ${err}`);
      return [];
    }
  }

  private processRazor1911Achievements(
    filePath: string
  ): UnlockedAchievement[] {
    try {
      const fileContent = readFileSync(filePath, "utf-8");
      const lines = this.extractLines(fileContent);

      return lines
        .map((line) => {
          const [name, unlocked, unlockTime] = line.split(" ");
          return unlocked === "1"
            ? { name, unlockTime: Number(unlockTime) * 1000 }
            : null;
        })
        .filter(Boolean) as UnlockedAchievement[];
    } catch (err) {
      console.error(
        `Error processing Razor1911 achievements: ${filePath}`,
        err
      );
      logger.log("error", `Error processing Razor1911 achievements: ${err}`);
      return [];
    }
  }

  private extractLines(fileContent: string): string[] {
    const lines =
      fileContent.charCodeAt(0) === 0xfeff
        ? fileContent.slice(1).split(/[\r\n]+/)
        : fileContent.split(/[\r\n]+/);
    return lines.filter((line) => line.trim().length > 0);
  }

  private parseIniContent(fileContent: string): Record<string, any> {
    const lines = this.extractLines(fileContent);
    const iniObject: Record<string, Record<string, string | number>> = {};
    let sectionName = "";

    for (const line of lines) {
      if (line.startsWith("[") && line.endsWith("]")) {
        sectionName = line.slice(1, -1);
        iniObject[sectionName] = {};
      } else {
        const [key, ...value] = line.split("=");
        iniObject[sectionName][key.trim()] = value.join("=").trim();
      }
    }

    return iniObject;
  }

  private handleGenericIniFormat(data: any): UnlockedAchievement[] {
    return Object.keys(data).map((key) => ({
      name: key,
      unlockTime: Date.now(),
    }));
  }

  private handleOnlineFixFormat(data: any): UnlockedAchievement[] {
    return Object.entries(data).map(([key, value]) => ({
      name: key,
      unlockTime: Number(value),
    }));
  }

  private handleGoldbergFormat(data: any): UnlockedAchievement[] {
    return Object.entries(data.achievements).map(
      ([key, achievement]: [string, any]) => ({
        name: key,
        unlockTime: achievement.unlocked
          ? Number(achievement.unlockTime)
          : Date.now(),
      })
    );
  }

  private handleReloadedFormat(data: any): UnlockedAchievement[] {
    return Object.entries(data)
      .map(([key, unlocked]) =>
        unlocked ? { name: key, unlockTime: Date.now() } : null
      )
      .filter(Boolean) as UnlockedAchievement[];
  }

  private handleSkidrowFormat(data: any): UnlockedAchievement[] {
    return Object.entries(data)
      .map(([key, unlocked]) =>
        unlocked ? { name: key, unlockTime: Date.now() } : null
      )
      .filter(Boolean) as UnlockedAchievement[];
  }

  private handle3DMFormat(data: any): UnlockedAchievement[] {
    return Object.keys(data).map((key) => ({
      name: key,
      unlockTime: Date.now(),
    }));
  }

  private handleCreamAPIFormat(data: any): UnlockedAchievement[] {
    return Object.entries(data.achievements).map(
      ([key, achievement]: [string, any]) => ({
        name: key,
        unlockTime: achievement.unlocked
          ? Number(achievement.unlockTime)
          : Date.now(),
      })
    );
  }
}

export { AchievementParser };
