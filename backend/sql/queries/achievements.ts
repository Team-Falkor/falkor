import { AchievementDBItem, NewAchievementInputDBItem } from "@/@types";
import { logger } from "../../handlers/logging";
import { db } from "../knex";
import { BaseQuery } from "./base";

class AchievementsDB extends BaseQuery {
  protected initialized: boolean = false;

  /**
   * Initializes the database schema for achievements if it doesn't already exist.
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      const exists = await db.schema.hasTable("achievements");
      if (!exists) {
        await db.schema.createTable("achievements", (table) => {
          table.increments("id").primary().notNullable();
          table.string("game_id").notNullable().unique();
          table.string("game_name").notNullable();
          table.string("achievement_name").notNullable().unique();
          table.string("achievement_display_name").notNullable();
          table.string("achievement_description").defaultTo("");
          table.string("achievement_image").notNullable();
          table.boolean("achievement_unlocked").defaultTo(false); // Boolean field.
        });
      }
      this.initialized = true;
    } catch (error) {
      console.error("Error initializing achievements database:", error);
      logger.log("error", `Error initializing achievements database: ${error}`);
    }
  }

  /**
   * Adds a new achievement to the database.
   * @param input - The achievement details to add.
   */
  async addAchievement(input: NewAchievementInputDBItem): Promise<void> {
    await this.init();

    const {
      game_id,
      game_name,
      achievement_name,
      achievement_display_name,
      achievement_image,
    } = input;
    if (
      !game_id ||
      !game_name ||
      !achievement_name ||
      !achievement_display_name ||
      !achievement_image
    ) {
      throw new Error("Missing required fields for adding an achievement.");
    }

    try {
      await db("achievements").insert({
        game_id,
        game_name,
        achievement_name,
        achievement_display_name,
        achievement_description: input.achievement_description || "",
        achievement_image,
        achievement_unlocked: input.achievement_unlocked ?? false,
      });
    } catch (error) {
      console.error("Error adding achievement:", error);
      logger.log("error", `Error adding achievement: ${error}`);
    }
  }

  /**
   * Retrieves an achievement by its unique ID.
   * @param id - The ID of the achievement.
   * @returns The achievement if found, or null.
   */
  async getAchievementById(id: number): Promise<AchievementDBItem | null> {
    await this.init();

    try {
      return await db("achievements").where({ id }).first();
    } catch (error) {
      console.error("Error retrieving achievement by ID:", error);
      logger.log("error", `Error retrieving achievement by ID: ${error}`);
      return null;
    }
  }

  /**
   * Retrieves all achievements, optionally filtered by game ID or unlocked status.
   * @param filter - Optional filters for game ID or unlocked status.
   */
  async getAchievements(filter?: {
    game_id?: string;
    achievement_unlocked?: boolean;
    achievement_name?: string;
  }): Promise<AchievementDBItem[]> {
    await this.init();

    try {
      const query = db("achievements");

      if (filter?.game_id) query.where("game_id", filter.game_id);
      if (filter?.achievement_unlocked !== undefined)
        query.andWhere("achievement_unlocked", filter.achievement_unlocked);

      return await query.select("*");
    } catch (error) {
      console.error("Error retrieving achievements:", error);
      logger.log("error", `Error retrieving achievements: ${error}`);
      return [];
    }
  }

  /**
   * Updates an achievement's details by ID.
   * @param id - The ID of the achievement to update.
   * @param updates - The fields to update.
   */
  async updateAchievement(
    id: number,
    updates: Partial<NewAchievementInputDBItem>
  ): Promise<void> {
    await this.init();

    try {
      await db("achievements").where({ id }).update(updates);
    } catch (error) {
      console.error("Error updating achievement:", error);
      logger.log("error", `Error updating achievement: ${error}`);
    }
  }

  /**
   * Deletes an achievement by ID.
   * @param id - The ID of the achievement to delete.
   */
  async deleteAchievement(id: number): Promise<void> {
    await this.init();

    try {
      await db("achievements").where({ id }).del();
    } catch (error) {
      console.error("Error deleting achievement:", error);
      logger.log("error", `Error deleting achievement: ${error}`);
    }
  }

  /**
   * Retrieves all achievements for a specific game.
   * @param game_id - The unique ID of the game.
   * @returns A list of achievements for the specified game.
   */
  async getAchievementsByGame(game_id: string): Promise<AchievementDBItem[]> {
    await this.init();

    try {
      return await db("achievements").where({ game_id }).select("*");
    } catch (error) {
      console.error("Error retrieving achievements by game ID:", error);
      logger.log("error", `Error retrieving achievements by game ID: ${error}`);
      return [];
    }
  }
}

// Export a singleton instance of the AchievementsDB class.
const achievementsDB = new AchievementsDB();
export { achievementsDB };
