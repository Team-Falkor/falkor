import { List, ListGame } from "@/@types";
import logger from "../../handlers/logging";
import { db } from "../knex";
import { BaseQuery } from "./base";

/**
 * Handles CRUD operations for lists and games in the database
 */
class ListsDatabase extends BaseQuery {
  /**
   * Indicates if the database has been initialized
   */
  initialized: boolean = false;

  /**
   * Initializes the database tables if they don't exist
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    // Ensure tables are created only once
    try {
      // Create the "lists" table
      await db.schema.hasTable("lists").then(async (exists) => {
        if (exists) return;
        await db.schema.createTable("lists", (table) => {
          table.increments("id").primary();
          table.string("name").notNullable().unique();
          table.string("description");
        });
      });

      // Create the "games" table
      await db.schema.hasTable("games").then(async (exists) => {
        if (exists) return;

        await db.schema.createTable("games", (table) => {
          table.increments("id").primary();
          table.integer("game_id").notNullable().unique();
          table.string("title").notNullable();
          table.string("description");
          table.string("image");
          table.string("release_date");
          table.string("genre");
        });
      });

      // Create the "list_games" table
      await db.schema.hasTable("list_games").then(async (exists) => {
        if (exists) return;
        await db.schema.createTable("list_games", (table) => {
          table.integer("list_id").unsigned().notNullable();
          table.integer("game_id").unsigned().notNullable();
          table.primary(["list_id", "game_id"]);
          table
            .foreign("list_id")
            .references("id")
            .inTable("lists")
            .onDelete("CASCADE");
          table
            .foreign("game_id")
            .references("game_id")
            .inTable("games")
            .onDelete("CASCADE");
        });
      });
    } catch (error) {
      console.error("Error creating tables:", error);
      logger.log("error", `Error creating tables: ${error}`);
      throw error;
    }

    this.initialized = true;
  }

  /**
   * Creates a new list
   * @param {string} name The name of the list
   * @param {string} [description] The description of the list
   */
  async createList(name: string, description?: string): Promise<void> {
    await this.init();
    try {
      await db.transaction(async (trx) => {
        await trx("lists").insert({ name, description: description || null });
      });
    } catch (error) {
      logger.log("error", `Error creating list: ${(error as Error).message}`);
      throw new Error(`Failed to create list: ${(error as Error).message}`);
    }
  }

  /**
   * Adds a game to the games table and links it to a specific list
   * @param {number} listId The ID of the list to add the game to
   * @param {ListGame} game The game to add to the list
   */
  async addGameToList(list_id: number, game: ListGame): Promise<void> {
    await this.init();

    try {
      await db.transaction(async (trx) => {
        // Insert the game if it doesn't already exist
        await trx("games")
          .insert({
            game_id: game.game_id,
            title: game.title,
            description: game.description || null,
            image: game.image || null,
            release_date: game.release_date || null,
            genre: game.genre || null,
          })
          .onConflict("game_id")
          .ignore(); // Ignore if the game already exists

        // Link the game to the list
        await trx("list_games").insert({ list_id, game_id: game.game_id });
      });
    } catch (error) {
      logger.log("error", `Error adding game to list: ${(error as Error).message}`);
      throw new Error(`Failed to add game to list: ${(error as Error).message}`);
    }
  }

  /**
   * Gets all games in a specific list
   * @param {number} listId The ID of the list to get the games from
   * @returns {Promise<ListGame[]>} The list of games in the list
   */
  async getGamesInList(listId: number): Promise<ListGame[]> {
    await this.init();

    try {
      return db("games as g")
        .join("list_games as lg", "g.game_id", "lg.game_id")
        .where("lg.list_id", listId)
        .select("g.*");
    } catch (error) {
      console.error(`Error getting games in list: ${error}`);
      throw error;
    }
  }

  /**
   * Gets all lists
   * @returns {Promise<List[]>} The list of lists
   */
  async getAllLists(): Promise<List[]> {
    await this.init();

    try {
      return db("lists").select("*");
    } catch (error) {
      console.error(`Error getting all lists: ${error}`);
      throw error;
    }
  }

  /**
   * Removes a game from a specific list
   * @param {number} listId The ID of the list to remove the game from
   * @param {number} gameId The ID of the game to remove
   */
  async removeGameFromList(list_id: number, game_id: number): Promise<void> {
    await this.init();

    try {
      await db("list_games").where({ list_id, game_id }).del();
    } catch (error) {
      console.error(`Error removing game from list: ${error}`);
      throw error;
    }
  }

  /**
   * Deletes a list and all its games (removes the links, not the games themselves)
   * @param {number} listId The ID of the list to delete
   */
  async deleteList(list_id: number): Promise<void> {
    await this.init();

    try {
      // Delete the list
      await db("lists").where({ id: list_id }).del();

      // Remove all links between the list and games
      await db("list_games").where({ list_id }).del();
    } catch (error) {
      console.error(`Error deleting list: ${error}`);
      throw error;
    }
  }

  /**
   * Deletes a game entirely
   * @param {number} gameId The ID of the game to delete
   */
  async deleteGame(game_id: number): Promise<void> {
    await this.init();

    try {
      await db.transaction(async (trx) => {
        // Remove all links between the game and lists first
        await trx("list_games").where({ game_id }).del();
        
        // Then delete the game
        await trx("games").where({ game_id }).del();
      });
    } catch (error) {
      logger.log("error", `Error deleting game: ${(error as Error).message}`);
      throw new Error(`Failed to delete game: ${(error as Error).message}`);
    }
  }
}

const listsDB = new ListsDatabase();

export { listsDB };
