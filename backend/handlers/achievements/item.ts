import {
  AchievementFile,
  AchivementStat,
  ISchemaForGame,
  UnlockedAchievement,
} from "@/@types/achievements/types";
import { achievementData } from "./data";
import { AchievementFileLocator } from "./locator";
import { AchievementParser } from "./parse";
import { AchievementWatcher } from "./watcher";

interface Options {
  game_name: string;
  game_id: string;
  game_icon?: string;
}

class AchievementItem {
  private initialized = false;

  public game_name: string;
  public game_id: string;
  public game_icon: string | null = null;

  private achievement_files: AchievementFile[] = [];
  private readonly parser = new AchievementParser();
  private readonly api = achievementData;

  private achivement_data: ISchemaForGame | null = null;
  private file_unlocked_achievements: Set<UnlockedAchievement> = new Set();

  private watcher: AchievementWatcher | null = null;

  constructor({ game_name, game_id, game_icon }: Options) {
    this.game_name = game_name;
    this.game_id = game_id;
    this.game_icon = game_icon || null;
  }

  /**
   * Initialize the AchievementItem with API data.
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log(`Initializing AchievementItem for game: ${this.game_name}`);
      this.achivement_data = await this.api.get(this.game_id);
      console.log(`API data fetched for game: ${this.game_name}`);
      this.initialized = true;

      return;
    } catch (error) {
      console.error(
        `Failed to initialize AchievementItem for game: ${this.game_name}`,
        error
      );
      this.initialized = false;
      return;
    }
  }

  /**
   * Locate achievement files associated with the game.
   */
  async find(): Promise<void> {
    await this.init();

    try {
      console.log(`Finding achievement files for game: ${this.game_name}`);
      this.achievement_files = AchievementFileLocator.findAchievementFiles(
        this.game_id
      );

      this.watcher = new AchievementWatcher(this.achievement_files[0].path);
      this.watcher.start(async (event) => {
        if (event !== "change") return;
        console.log(await this.compare());
      });
    } catch (error) {
      console.error(
        `Error finding achievement files for game: ${this.game_name}`,
        error
      );
    }
  }

  /**
   * Parse achievements from located files and update unlocked achievements.
   */
  async parse(): Promise<void> {
    for (const file of this.achievement_files) {
      try {
        const parsedAchievements = this.parser.parseAchievements(
          file.path,
          file.cracker
        );
        parsedAchievements.forEach((achievement) =>
          this.file_unlocked_achievements.add(achievement)
        );
      } catch (error) {
        console.error(`Error parsing achievement file: ${file.path}`, error);
      }
    }
  }

  /**
   * Compare unlocked achievements with API data to generate a detailed list of unlocked stats.
   */
  async compare(): Promise<AchivementStat[] | undefined> {
    await this.parse();

    if (!this.achivement_data?.game?.availableGameStats?.achievements) {
      console.warn(`No achievements available for game: ${this.game_name}`);
      return;
    }

    const unlockedAchievements = new Map<string, AchivementStat>();

    const achievements =
      this.achivement_data.game.availableGameStats.achievements;

    for (const fileAchievement of this.file_unlocked_achievements) {
      if (unlockedAchievements.has(fileAchievement.name)) continue;

      const matchedAchievement = achievements.find(
        (achievement) => achievement.name === fileAchievement.name
      );

      if (matchedAchievement) {
        unlockedAchievements.set(fileAchievement.name, {
          displayName: matchedAchievement.displayName,
          hidden: matchedAchievement.hidden,
          description: matchedAchievement.description,
          icon: matchedAchievement?.icon ?? this.game_icon,
          icongray: matchedAchievement?.icongray ?? this.game_icon,
          unlockTime: fileAchievement.unlockTime,
        });
      }
    }

    return Array.from(unlockedAchievements.values());
  }

  get watcher_instance() {
    return this.watcher;
  }
}

export { AchievementItem };
