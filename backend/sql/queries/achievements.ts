import { AchievementDBItem, NewAchievementInputDBItem } from "@/@types";
import { db } from "../knex";
import { BaseQuery } from "./base";

/**
 * Handles operations on the `achievements` table in the database.
 * The `achievements` table contains all achievements for games in the library.
 *
 * @class
 */
class AchievementsDatabase extends BaseQuery {
  initialized: boolean = false;
  /**
   * Initializes the achievements database.
   *
   * @returns {Promise<void>}
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Ensure the "achievements" table exists
      await db.schema.hasTable("achievements").then(async (exists) => {
        if (!exists) {
          await db.schema.createTable("achievements", (table) => {
            table.increments("id").primary();
            table
              .string("game_id")
              .notNullable()
              .references("game_id")
              .inTable("library_games")
              .onDelete("CASCADE");

            table.string("achievement_display_name").notNullable();
            table.string("achievement_name").notNullable();
            table.string("description");
            table.boolean("unlocked").defaultTo(false);
            table.dateTime("unlocked_at").defaultTo(db.fn.now());
            table.unique(["game_id", "achievement_name"]); // Ensure no duplicate achievements per game
          });
        }
      });

      this.initialized = true;
    } catch (error) {
      console.error("Error initializing achievements database:", error);
      this.initialized = false;

      throw error;
    }
  }

  /**
   * Adds a new achievement for a game.
   *
   * @param {NewAchievementInputDBItem} achievement - The achievement to add.
   * @returns {Promise<void>}
   */
  async addAchievement(achievement: NewAchievementInputDBItem): Promise<boolean> {
    await this.init();

    return await this.executeTransaction(async (trx) => {
      // Check if the game exists
      const gameExists = await trx("library_games")
        .where("game_id", achievement.game_id)
        .first();

      if (!gameExists) {
        throw new Error(`Game with ID ${achievement.game_id} does not exist.`);
      }

      await trx("achievements").insert({
        game_id: achievement.game_id,
        achievement_name: achievement.achievement_name,
        achievement_display_name: achievement.achievement_display_name,
        description: achievement.achievement_description ?? null,
        unlocked: achievement.achievement_unlocked ?? false,
      });
      return true;
    }, "Error adding achievement")
  }

  /**
   * Unlocks an achievement for a game.
   *
   * @param {number} gameId - The ID of the game.
   * @param {string} achievementName - The name of the achievement.
   * @returns {Promise<void>}
   */
  async unlockAchievement(
    gameId: number,
    achievementName: string
  ): Promise<boolean> {
    await this.init();

    return await this.executeTransaction(async (trx) => {
      const result = await trx("achievements")
        .where({ game_id: gameId, achievement_name: achievementName })
        .update({
          unlocked: true,
          unlocked_at: new Date(),
        });
      
      if (result === 0) {
        throw new Error(`Achievement ${achievementName} not found for game ${gameId}`);
      }
      return true;
    }, "Error unlocking achievement")
  }

  /**
   * Removes an achievement for a game.
   *
   * @param {number} gameId - The ID of the game.
   * @param {string} achievementName - The name of the achievement.
   * @returns {Promise<void>}
   */
  async removeAchievement(
    gameId: number,
    achievementName: string
  ): Promise<boolean> {
    await this.init();

    return await this.executeTransaction(async (trx) => {
      const result = await trx("achievements")
        .where({ game_id: gameId, achievement_name: achievementName })
        .del();
      return result > 0;
    }, "Error removing achievement")
  }

  /**
   * Retrieves all achievements for a game.
   *
   * @param {number} gameId - The ID of the game.
   * @returns {Promise<AchievementDBItem[]>} - List of achievements for the game.
   */
  async getAchievementsByGameId(gameId: number): Promise<AchievementDBItem[]> {
    await this.init();

    try {
      const achievements: AchievementDBItem[] = await db("achievements")
        .where({ game_id: gameId })
        .select("*");
      return achievements;
    } catch (error) {
      console.error("Error retrieving achievements:", error);
      throw error;
    }
  }

  /**
   * Retrieves unlocked achievements for a game.
   *
   * @param {number} gameId - The ID of the game.
   * @returns {Promise<AchievementDBItem[]>} - List of unlocked achievements for the game.
   */
  async getUnlockedAchievements(gameId: string): Promise<AchievementDBItem[]> {
    await this.init();

    return await this.executeOperation(async () => {
      const unlockedAchievements: AchievementDBItem[] = await db("achievements")
        .where({ game_id: gameId, unlocked: true })
        .select("*");

      return unlockedAchievements;
    }, "Error retrieving unlocked achievements") ?? []
  }

  /**
   * Resets (locks) an achievement for a game.
   *
   * @param {number} gameId - The ID of the game.
   * @param {string} achievementName - The name of the achievement.
   * @returns {Promise<void>}
   */
  async resetAchievement(
    gameId: number,
    achievementName: string
  ): Promise<boolean> {
    await this.init();

    return await this.executeTransaction(async (trx) => {
      const result = await trx("achievements")
        .where({ game_id: gameId, achievement_name: achievementName })
        .update({
          unlocked: false,
          unlocked_at: null,
        });
      return result > 0;
    }, "Error resetting achievement")
  }
}

const achievementsDB = new AchievementsDatabase();

export { achievementsDB };
