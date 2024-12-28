import {
  AchievementFile,
  AchivementStat,
  ISchemaForGame,
  UnlockedAchievement,
} from "@/@types/achievements/types";
import { achievementsDB } from "../../sql";
import { NotificationsHandler } from "../notifications";
import { achievementData } from "./data";
import { AchievementFileLocator } from "./locator";
import { AchievementParser } from "./parse";
import { AchievementWatcher } from "./watcher";

interface Options {
  game_name: string;
  game_id: string;
  game_icon?: string;
  steam_id?: string | null;
}

class AchievementItem {
  private initialized = false;

  public game_name: string;
  public game_id: string;
  public steam_id: string | null = null;
  public game_icon: string | null = null;

  private achievement_files: AchievementFile[] = [];
  private readonly parser = new AchievementParser();
  private readonly api = achievementData;

  private achivement_data: ISchemaForGame | null = null;
  private file_unlocked_achievements: Set<UnlockedAchievement> = new Set();

  private watcher: AchievementWatcher | null = null;

  constructor({ game_name, game_id, game_icon, steam_id }: Options) {
    this.game_name = game_name;
    this.game_id = game_id;
    this.steam_id = steam_id || null;
    this.game_icon = game_icon || null;
  }

  /**
   * Initialize the AchievementItem with API data.
   */
  async init(): Promise<void> {
    if (this.initialized) return;
    if (!this.steam_id) return;

    try {
      console.log(`Initializing AchievementItem for game: ${this.game_name}`);
      this.achivement_data = await this.api.get(this.steam_id);
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
    if (!this.steam_id) return;
    if (!this.initialized) {
      await this.init();
    }

    try {
      console.log(`Finding achievement files for game: ${this.game_name}`);
      this.achievement_files = AchievementFileLocator.findAchievementFiles(
        this.steam_id
      );

      if (this.achievement_files.length === 0) return;

      const watcherPath = this.achievement_files[0].path;
      this.watcher = new AchievementWatcher(watcherPath);
      this.watcher.start(async (event) => {
        if (event !== "change") return;

        const unlocked = await this.compare();
        if (!unlocked) return;

        if (!this.steam_id) return;
        const dbItems = new Set(
          (await achievementsDB.getUnlockedAchievements(this.game_id)).map(
            (item) => item.achievement_name
          )
        );

        for (const achievement of unlocked) {
          if (dbItems.has(achievement.name)) continue;

          console.log(`Adding new achievement: ${achievement.name}`);
          await achievementsDB.addAchievement({
            achievement_display_name: achievement.displayName,
            game_id: this.game_id,
            achievement_name: achievement.name,
            achievement_description: achievement.description,
            achievement_image: watcherPath,
            achievement_unlocked: true,
          });

          NotificationsHandler.constructNotification(
            {
              title: achievement.displayName,
              body: "New achievement unlocked",
              icon: achievement.icon
                ? await NotificationsHandler.createImage(achievement.icon)
                : this.game_icon
                  ? await NotificationsHandler.createImage(this.game_icon)
                  : undefined,
              notificationType: "achievement_unlocked",
            },
            true
          );
        }
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
    if (!this.steam_id) return;

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
          name: fileAchievement.name,
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
