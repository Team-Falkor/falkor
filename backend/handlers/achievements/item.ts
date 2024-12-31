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

/**
 * Class representing an Achievement Item for a specific game.
 */
class AchievementItem {
  private bufferInterval: number = 2000;
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
  private notificationBuffer: AchivementStat[] = [];
  private notificationTimer: NodeJS.Timeout | null = null;

  /**
   * Creates an instance of AchievementItem.
   * @param {Options} options - Options for initializing the AchievementItem.
   */
  constructor({ game_name, game_id, game_icon, steam_id }: Options) {
    this.game_name = game_name;
    this.game_id = game_id;
    this.steam_id = steam_id || null;
    this.game_icon = game_icon || null;
  }

  /**
   * Initializes the AchievementItem by fetching achievement data.
   * @returns {Promise<void>}
   */
  async init(): Promise<void> {
    if (this.initialized || !this.steam_id) return;

    try {
      console.log(`Initializing AchievementItem for game: ${this.game_name}`);
      this.achivement_data = await this.api.get(this.steam_id);
      this.initialized = true;
    } catch (error) {
      console.error(
        `Failed to initialize AchievementItem for game: ${this.game_name}`,
        error
      );
    }
  }

  /**
   * Finds achievement files and starts watching for changes.
   * @returns {Promise<void>}
   */
  async find(): Promise<void> {
    if (!this.steam_id) return;
    if (!this.initialized) await this.init();

    try {
      console.log(`Finding achievement files for game: ${this.game_name}`);
      this.achievement_files = AchievementFileLocator.findAchievementFiles(
        this.steam_id
      );

      if (this.achievement_files.length === 0) return;

      const watcherPath = this.achievement_files[0].path;
      this.watcher = new AchievementWatcher(watcherPath);
      this.watcher.start(async (event) => {
        if (event === "change") await this.handleAchievementChange();
      });
    } catch (error) {
      console.error(
        `Error finding achievement files for game: ${this.game_name}`,
        error
      );
    }
  }

  /**
   * Handles achievement file changes by comparing and notifying new achievements.
   * @private
   * @returns {Promise<void>}
   */
  private async handleAchievementChange(): Promise<void> {
    const unlocked = await this.compare();
    if (!unlocked) return;

    const dbItems = new Set(
      (await achievementsDB.getUnlockedAchievements(this.game_id)).map(
        (item) => item.achievement_name
      )
    );

    const newAchievements = unlocked.filter(
      (achievement) => !dbItems.has(achievement.name)
    );

    if (newAchievements.length > 0) {
      await this.saveAndNotify(newAchievements);
    }
  }

  /**
   * Saves new achievements to the database and buffers notifications.
   * @private
   * @param {AchivementStat[]} achievements - Array of new achievements to save and notify.
   * @returns {Promise<void>}
   */
  private async saveAndNotify(achievements: AchivementStat[]): Promise<void> {
    for (const achievement of achievements) {
      console.log(`Adding new achievement: ${achievement.name}`);
      await achievementsDB.addAchievement({
        achievement_display_name: achievement.displayName,
        game_id: this.game_id,
        achievement_name: achievement.name,
        achievement_description: achievement.description,
        achievement_image: achievement.icon,
        achievement_unlocked: true,
      });
    }

    this.bufferNotifications(achievements);
  }

  /**
   * Buffers notifications to be sent after a delay.
   * @private
   * @param {AchivementStat[]} achievements - Array of new achievements to notify.
   */
  private bufferNotifications(achievements: AchivementStat[]): void {
    this.notificationBuffer.push(...achievements);

    if (this.notificationTimer) {
      clearTimeout(this.notificationTimer);
    }

    this.notificationTimer = setTimeout(
      () => this.flushNotifications(),
      this.bufferInterval
    );
  }

  /**
   * Flushes buffered notifications, sending a summary notification.
   * @private
   * @returns {Promise<void>}
   */
  private async flushNotifications(): Promise<void> {
    if (this.notificationBuffer.length === 0) return;

    const summaryTitle =
      this.notificationBuffer.length === 1
        ? this.notificationBuffer[0].displayName
        : `${this.notificationBuffer.length} Achievements Unlocked!`;

    const summaryBody =
      this.notificationBuffer.length === 1
        ? (this.notificationBuffer[0].description ?? "New achievement unlocked")
        : this.notificationBuffer
            .map((ach) => `- ${ach.displayName}`)
            .join("\n");

    const findIcon = this.notificationBuffer.filter((ach) => !ach.icon?.length);
    const icon = findIcon[0]?.icon ?? this.game_icon ?? null;

    NotificationsHandler.constructNotification(
      {
        title: summaryTitle,
        body: summaryBody,
        icon: icon ? await NotificationsHandler.createImage(icon) : undefined,
        notificationType: "achievement_unlocked",
      },
      true
    );

    this.notificationBuffer = [];
    this.notificationTimer = null;
  }

  /**
   * Parses achievement files to get unlocked achievements.
   * @returns {Promise<void>}
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
   * Compares parsed achievements with the schema data to find newly unlocked achievements.
   * @returns {Promise<AchivementStat[] | undefined>}
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
          icon: matchedAchievement.icon ?? this.game_icon,
          icongray: matchedAchievement.icongray ?? this.game_icon,
          unlockTime: fileAchievement.unlockTime,
        });
      }
    }

    return Array.from(unlockedAchievements.values());
  }

  /**
   * Gets the instance of the AchievementWatcher.
   * @returns {AchievementWatcher | null}
   */
  get watcher_instance() {
    return this.watcher;
  }
}

export { AchievementItem };
