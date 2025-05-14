import { sql } from "drizzle-orm";
import {
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { libraryGames } from "./game";

export const achievements = sqliteTable(
	"achievements",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		gameId: text("game_id")
			.notNull()
			.references(() => libraryGames.gameId, { onDelete: "cascade" }),
		achievementDisplayName: text("achievement_display_name").notNull(),
		achievementName: text("achievement_name").notNull(),
		description: text("description"),
		unlocked: integer("unlocked", { mode: "boolean" }).notNull().default(false),
		unlockedAt: integer({ mode: "timestamp" })
			.default(sql`(unixepoch())`)
			.notNull(),
	},
	(table) => [
		uniqueIndex("unique_achievement_name").on(
			table.gameId,
			table.achievementName,
		),
	],
);
