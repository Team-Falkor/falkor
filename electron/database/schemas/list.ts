import { relations } from "drizzle-orm";
import {
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { libraryGames } from "./game";

export const lists = sqliteTable(
	"lists",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		name: text("name").notNull(),
		description: text("description"),
	},
	(table) => [uniqueIndex("lists_name_unique").on(table.name)],
);

export const listsToGames = sqliteTable(
	"lists_library_games",
	{
		listId: integer("list_id")
			.notNull()
			.references(() => lists.id),
		gameId: integer("game_id")
			.notNull()
			.references(() => libraryGames.id),
	},
	(table) => [
		uniqueIndex("lists_library_games_unique").on(table.listId, table.gameId),
	],
);

export const listsRelations = relations(lists, ({ many }) => ({
	games: many(listsToGames),
}));

export const listsToGamesRelations = relations(listsToGames, ({ one }) => ({
	list: one(lists, {
		fields: [listsToGames.listId],
		references: [lists.id],
	}),
	game: one(libraryGames, {
		fields: [listsToGames.gameId],
		references: [libraryGames.id],
	}),
}));
