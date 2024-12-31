import {
  LibraryGame,
  LibraryGameUpdate,
  NewLibraryGame,
} from "@/@types/library/types";
import { logger } from "../../handlers/logging";
import { db } from "../knex";
import { achievementsDB } from "./achievements";
import { BaseQuery } from "./base";

/**
 * Handles operations on the `library_games` table in the database.
 * The `library_games` table contains all games in the library.
 *
 * @class
 */
class GamesDatabase extends BaseQuery {
  achievementsDb: typeof achievementsDB = achievementsDB;

  /**
   * Whether the database has been initialized.
   *
   * @protected
   * @type {boolean}
   */
  initialized: boolean = false;

  /**
   * Initializes the database.
   *
   * @returns {Promise<void>}
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Ensure the "library_games" table exists
      await db.schema.hasTable("library_games").then(async (exists) => {
        if (!exists) {
          await db.schema.createTable("library_games", (table) => {
            table.increments("id").primary();
            table.string("game_name").notNullable().unique();
            table.string("game_path").notNullable().unique();
            table.string("game_id").notNullable().unique();
            table.string("game_steam_id");
            table.string("game_icon");
            table.string("game_args");
            table.string("game_command");
            table.string("wine_prefix_folder");
            table.integer("game_playtime").defaultTo(0);
            table.dateTime("game_last_played").defaultTo(null);
            table.integer("igdb_id").defaultTo(null);
          });
        }

        await db.schema
          .hasColumn("library_games", "game_last_played")
          .then(async (exists) => {
            if (!exists) {
              await db.schema.table("library_games", (table) => {
                table.dateTime("game_last_played").defaultTo(null);
              });
            }
          });

        await db.schema
          .hasColumn("library_games", "game_playtime")
          .then(async (exists) => {
            if (!exists) {
              await db.schema.table("library_games", (table) => {
                table.integer("game_playtime").defaultTo(0);
              });
            }
          });

        await db.schema
          .hasColumn("library_games", "igdb_id")
          .then(async (exists) => {
            if (!exists) {
              await db.schema.table("library_games", (table) => {
                table.integer("igdb_id").defaultTo(null);
              });
            }
          });
      });

      await db.schema
        .hasColumn("library_games", "game_steam_id")
        .then(async (exists) => {
          if (!exists) {
            await db.schema.table("library_games", (table) => {
              table.string("game_steam_id");
            });
          }
        });

      await db.schema
        .hasColumn("library_games", "wine_prefix_folder")
        .then(async (exists) => {
          if (!exists) {
            await db.schema.table("library_games", (table) => {
              table.string("wine_prefix_folder");
            });
          }
        });

      this.initialized = true;
    } catch (error) {
      console.error("Error initializing database:", error);
      logger.log(
        "error",
        `Error initializing database: ${(error as Error).message}`
      );
    }
  }

  /**
   * Adds a new game to the library.
   *
   * @param {Object} game - The game to add.
   * @param {string} game.name - The name of the game.
   * @param {string} game.path - The path to the game.
   * @param {string} game.id - The ID of the game.
   * @param {string} [game.icon] - The icon of the game.
   * @param {string} [game.args] - The arguments to pass to the game when launching it.
   * @param {string} [game.command] - The command to use when launching the game.
   *
   * @returns {Promise<LibraryGame>}
   */
  async addGame(game: NewLibraryGame): Promise<LibraryGame> {
    await this.init();
    if (!this.initialized) throw new Error("Database not initialized");

    const newData: NewLibraryGame = {
      game_name: game.game_name || "",
      game_path: game.game_path || "",
      game_id: game.game_id || "",
      game_icon: game.game_icon || undefined,
      game_args: game.game_args || undefined,
      game_command: game.game_command || undefined,
      igdb_id: game.igdb_id || null,
      game_steam_id: game.game_steam_id || null,
    };

    const newGame = await db("library_games").insert<LibraryGame>(newData);

    return newGame;
  }

  /**
   * Gets a game from the library by ID.
   *
   * @param {string} gameId - The ID of the game to retrieve.
   *
   * @returns {Promise<Object>} - The retrieved game.
   */
  async getGameById(gameId: string): Promise<LibraryGame | null> {
    await this.init();
    if (!this.initialized) throw new Error("Database not initialized");

    const game = await db("library_games").where({ game_id: gameId }).first();
    return game;
  }

  async getGameByIGDBId(gameId: string): Promise<LibraryGame | null> {
    await this.init();
    if (!this.initialized) throw new Error("Database not initialized");

    const game = await db("library_games").where({ igdb_id: gameId }).first();
    return game;
  }

  /**
   * Gets all games from the library.
   *
   * @returns {Promise<Object[]>} - The retrieved games.
   */
  async getAllGames(): Promise<LibraryGame[]> {
    await this.init();
    if (!this.initialized) throw new Error("Database not initialized");

    const games = await db("library_games").select("*");
    return games;
  }

  /**
   * Updates a game in the library.
   *
   * @param {string} gameId - The ID of the game to update.
   * @param {Object} updates - The updates to make to the game.
   * @param {string} [updates.name] - The new name of the game.
   * @param {string} [updates.path] - The new path of the game.
   * @param {string} [updates.icon] - The new icon of the game.
   * @param {string} [updates.args] - The new arguments to pass to the game when launching it.
   * @param {string} [updates.command] - The new command to use when launching the game..
   *
   * @returns {Promise<void>}
   */
  async updateGame(gameId: string, updates: LibraryGameUpdate): Promise<void> {
    await this.init();
    if (!this.initialized) throw new Error("Database not initialized");

    const currentGame = await this.getGameById(gameId);
    if (!currentGame) throw new Error("Game not found");

    const newData: LibraryGameUpdate = {
      game_name: updates.game_name || currentGame.game_name,
      game_path: updates.game_path || currentGame.game_path,
      game_icon: updates.game_icon || currentGame.game_icon,
      game_args: updates.game_args || currentGame.game_args,
      game_command: updates.game_command || currentGame.game_command,
      igdb_id: updates.igdb_id || currentGame.igdb_id,
      game_last_played:
        updates.game_last_played || currentGame.game_last_played,
      game_playtime: updates.game_playtime || currentGame.game_playtime,
    };

    await db("library_games").where({ game_id: gameId }).update(newData);
  }

  /**
   * Deletes a game from the library.
   *
   * @param {string} gameId - The ID of the game to delete.
   *
   * @returns {Promise<void>}
   */
  async deleteGame(gameId: string): Promise<void> {
    await this.init();

    if (!this.initialized) {
      console.error("Database not initialized");
      throw new Error("Database not initialized");
    }

    // Ensure gameId is defined and log the deletion attempt
    if (!gameId) {
      throw new Error("Game ID is required for deletion");
    }

    console.log(`Attempting to delete game with ID: ${gameId}`);

    try {
      const deletedRows = await db("library_games")
        .where({ game_id: gameId })
        .del();

      if (deletedRows === 0) {
        console.warn(`No game found with ID: ${gameId}`);
      } else {
        console.log(`Game with ID: ${gameId} deleted successfully`);
      }
    } catch (error) {
      console.error("Error deleting game:", error);
      throw error;
    }
  }

  /**
   * Retrieves a game by its name.
   *
   * @param {string} gameName - The name of the game to retrieve.
   * @returns {Promise<LibraryGame | null>}
   */
  async getGameByName(gameName: string): Promise<LibraryGame | null> {
    await this.init();
    if (!this.initialized) throw new Error("Database not initialized");

    const game = await db("library_games")
      .where({ game_name: gameName })
      .first();
    return game;
  }

  /**
   * Updates the playtime for a game.
   *
   * @param {string} gameId - The ID of the game to update.
   * @param {number} playtime - The amount of playtime to add (in minutes).
   * @returns {Promise<void>}
   */
  async updateGamePlaytime(gameId: string, playtime: number): Promise<void> {
    await this.init();
    if (!this.initialized) throw new Error("Database not initialized");

    const currentGame = await this.getGameById(gameId);
    if (!currentGame) throw new Error("Game not found");

    const updatedPlaytime = (currentGame.game_playtime || 0) + playtime;

    await db("library_games")
      .where({ game_id: gameId })
      .update({ game_playtime: updatedPlaytime });
  }

  /**
   * Retrieves recently played games, sorted by last played date.
   *
   * @param {number} limit - The number of games to retrieve.
   * @returns {Promise<LibraryGame[]>}
   */
  async getRecentlyPlayedGames(limit: number = 10): Promise<LibraryGame[]> {
    await this.init();
    if (!this.initialized) throw new Error("Database not initialized");

    const games = await db("library_games")
      .whereNotNull("game_last_played")
      .orderBy("game_last_played", "desc")
      .limit(limit);

    return games;
  }

  /**
   * Retrieves multiple games by their IGDB IDs.
   *
   * @param {number[]} igdbIds - The list of IGDB IDs to retrieve games for.
   * @returns {Promise<LibraryGame[]>}
   */
  async getGamesByIGDBIds(igdbIds: number[]): Promise<LibraryGame[]> {
    await this.init();
    if (!this.initialized) throw new Error("Database not initialized");

    const games = await db("library_games").whereIn("igdb_id", igdbIds);
    return games;
  }

  /**
   * Counts the total number of games in the library.
   *
   * @returns {Promise<number>}
   */
  async countGamesInLibrary(): Promise<number> {
    await this.init();
    if (!this.initialized) throw new Error("Database not initialized");

    const count = await db("library_games").count("id as total").first();
    return count ? Number(count.total) : 0;
  }

  /**
   * Retrieves a game along with its achievements.
   * @param {number} gameId - The ID of the game.
   */
  async getGameWithAchievements(gameId: number): Promise<any> {
    await this.init();
    const game = await this.getGameById(gameId.toString());
    if (!game) throw new Error("Game not found");

    const achievements = await this.achievementsDb.getAchievementsByGameId(
      game.id
    );
    return { ...game, achievements };
  }
}

const gamesDB = new GamesDatabase();

export { gamesDB };
