import { relations } from "drizzle-orm";
import {
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { achievements } from "./achievement";

export const libraryGames = sqliteTable(
	"library_games",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		gameName: text("game_name").notNull(),
		gamePath: text("game_path"),
		gameId: text("game_id").notNull(),
		gameSteamId: text("game_steam_id"),
		gameIcon: text("game_icon"),
		gameArgs: text("game_args"),
		gameCommand: text("game_command"),
		winePrefixFolder: text("wine_prefix_folder"),
		gamePlaytime: integer("game_playtime").notNull().default(0),
		gameLastPlayed: integer("game_last_played", { mode: "timestamp" }),
		igdbId: integer("igdb_id"),
		installed: integer("installed", { mode: "boolean" }).default(false),
	},
	(table) => [
		uniqueIndex("library_games_game_name_unique").on(table.gameName),
		uniqueIndex("library_games_game_path_unique").on(table.gamePath),
		uniqueIndex("library_games_game_id_unique").on(table.gameId),
	],
);

export const libraryGamesRelations = relations(libraryGames, ({ many }) => ({
	achievements: many(achievements),
}));
