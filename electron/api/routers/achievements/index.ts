import { achievementImporter } from "@backend/handlers/achievements/import";
import { SettingsManager } from "@backend/handlers/settings/settings";
import { getErrorMessage } from "@backend/utils/utils";
import type Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { z } from "zod";
import type { IGetSchemaForGame } from "@/@types";
import { publicProcedure, router } from "../../../api/trpc";
import { achievements } from "../../../database/schemas";

const settings = SettingsManager.getInstance();

type DB = BetterSQLite3Database<typeof import("../../../database/schemas")> & {
	$client: Database.Database;
};

/**
 * Retrieves all unlocked achievements for a given game ID.
 */
const getUnlocked = async (db: DB, gameId: string) => {
	try {
		const data = await db
			.select()
			.from(achievements)
			.where(eq(achievements.gameId, gameId));

		return data ?? [];
	} catch (error) {
		console.error("[tRPC][achievements.getUnlocked]", error);
		return [];
	}
};

/**
 * Fetches achievements data from the external API for a given Steam ID.
 */
export const getAchievementsDataFromApi = async (steamId: string) => {
	try {
		const apiBaseUrl = settings.get("api_base_url");
		const res = await fetch(`${apiBaseUrl}/achievements/${steamId}`);

		if (!res.ok) {
			throw new Error("Failed to fetch data");
		}

		const data: IGetSchemaForGame = await res.json();
		return data?.game?.availableGameStats?.achievements ?? [];
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const achievementsRouter = router({
	/**
	 * Retrieves all unlocked achievements for a given game ID.
	 */
	getUnlocked: publicProcedure
		.input(z.object({ gameId: z.string() }))
		.query(async ({ input, ctx }) => {
			return getUnlocked(ctx.db, input.gameId);
		}),

	/**
	 * Fetches achievements data from the external API for a given Steam ID.
	 */
	getAchievementsDataFromApi: publicProcedure
		.input(z.object({ steamId: z.string() }))
		.query(async ({ input }) => {
			return getAchievementsDataFromApi(input.steamId);
		}),

	/**
	 * Combines unlocked achievements with game data for a given Steam ID.
	 */
	getUnlockedWithGameData: publicProcedure
		.input(z.object({ steamId: z.string(), gameId: z.string() }))
		.query(async ({ input, ctx }) => {
			try {
				const [achievementsData, unlockedAchievements] = await Promise.all([
					getAchievementsDataFromApi(input.steamId),
					getUnlocked(ctx.db, input.gameId),
				]);

				const dataWithUnlocked = achievementsData
					.map((item) => ({
						...item,
						unlocked: unlockedAchievements.some(
							(u) => u.achievementName === item.name,
						),
					}))
					.sort((a, b) => {
						if (a.unlocked === b.unlocked) {
							return a.name.localeCompare(b.name);
						}
						return a.unlocked ? -1 : 1;
					});

				return dataWithUnlocked;
			} catch (error) {
				throw new Error(getErrorMessage(error));
			}
		}),

	getAll: publicProcedure.query(async ({ ctx }) => {
		try {
			const data = await ctx.db.query.achievements.findMany({
				with: {
					game: true,
				},
			});

			return data;
		} catch (error) {
			console.error("[tRPC][achievements.getAll]", error);
			return [];
		}
	}),

	import: publicProcedure
		.input(z.object({ steamId: z.string(), lang: z.string().default("en") }))
		.mutation(async ({ input }) => {
			try {
				await achievementImporter.importAchievements(input.steamId, input.lang);
			} catch (error) {
				console.error(error);
			}
		}),
});
