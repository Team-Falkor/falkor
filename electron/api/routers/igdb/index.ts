import { z } from "zod";
import { publicProcedure, router } from "../../../api/trpc";
import {
	type GameFilters,
	IGDBWrapper,
} from "../../../handlers/api-wrappers/igdb";
import { cache } from "../../../handlers/cache";

const igdb = IGDBWrapper.getInstance();

// Cache TTL constants (in milliseconds)
const CACHE_TTL = {
	// Static data - cache for longer periods
	STATIC: 24 * 60 * 60 * 1000, // 24 hours for genres, themes, game modes
	// Semi-static data - cache for moderate periods
	SEMI_STATIC: 6 * 60 * 60 * 1000, // 6 hours for top rated, new releases
	// Dynamic data - cache for shorter periods
	DYNAMIC: 30 * 60 * 1000, // 30 minutes for search results, filters
	// Game info - cache for moderate periods
	GAME_INFO: 2 * 60 * 60 * 1000, // 2 hours for individual game info
	// Calendar data - cache for shorter periods due to time sensitivity
	CALENDAR: 15 * 60 * 1000, // 15 minutes for calendar releases
};

export const igdbRouter = router({
	search: publicProcedure
		.input(
			z.object({
				query: z.string().min(1, "Search query cannot be empty"),
				limit: z.number().int().positive().optional().default(20),
				offset: z.number().int().min(0).optional().default(0),
			}),
		)
		.query(async ({ input }) => {
			const cacheKey = `igdb:search:${input.query}:${input.limit}:${input.offset}`;

			const cached = await cache.get(cacheKey);
			if (cached) return cached;

			const result = await igdb.search(input.query, input.limit, input.offset);
			await cache.set(cacheKey, result, { ttl: CACHE_TTL.DYNAMIC });

			return result;
		}),

	info: publicProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ input }) => {
			const cacheKey = `igdb:info:${input.id}`;

			const cached = await cache.get(cacheKey);
			if (cached) return cached;

			const result = await igdb.info(input.id);
			await cache.set(cacheKey, result, { ttl: CACHE_TTL.GAME_INFO });

			return result;
		}),

	top_rated: publicProcedure
		.input(
			z.object({
				limit: z.number().int().positive().optional().default(20),
				offset: z.number().int().min(0).optional().default(0),
			}),
		)
		.query(async ({ input }) => {
			const cacheKey = `igdb:top_rated:${input.limit}:${input.offset}`;

			const cached = await cache.get(cacheKey);
			if (cached) return cached;

			const result = await igdb.topRated(input.limit, input.offset);
			await cache.set(cacheKey, result, { ttl: CACHE_TTL.SEMI_STATIC });

			return result;
		}),

	new_releases: publicProcedure
		.input(
			z.object({
				limit: z.number().int().positive().optional().default(20),
				offset: z.number().int().min(0).optional().default(0),
			}),
		)
		.query(async ({ input }) => {
			const cacheKey = `igdb:new_releases:${input.limit}:${input.offset}`;

			const cached = await cache.get(cacheKey);
			if (cached) return cached;

			const result = await igdb.newReleases(input.limit, input.offset);
			await cache.set(cacheKey, result, { ttl: CACHE_TTL.SEMI_STATIC });

			return result;
		}),

	most_anticipated: publicProcedure
		.input(
			z.object({
				limit: z.number().int().positive().optional().default(20),
				offset: z.number().int().min(0).optional().default(0),
			}),
		)
		.query(async ({ input }) => {
			const cacheKey = `igdb:most_anticipated:${input.limit}:${input.offset}`;

			const cached = await cache.get(cacheKey);
			if (cached) return cached;

			const result = await igdb.mostAnticipated(input.limit, input.offset);
			await cache.set(cacheKey, result, { ttl: CACHE_TTL.SEMI_STATIC });

			return result;
		}),

	by_genre: publicProcedure
		.input(
			z.object({
				genre: z.string(),
				limit: z.number().int().positive().optional().default(20),
				offset: z.number().int().min(0).optional().default(0),
			}),
		)
		.query(async ({ input }) => {
			const cacheKey = `igdb:by_genre:${input.genre}:${input.limit}:${input.offset}`;

			const cached = await cache.get(cacheKey);
			if (cached) return cached;

			const result = await igdb.byGenre(input.genre, input.limit, input.offset);
			await cache.set(cacheKey, result, { ttl: CACHE_TTL.DYNAMIC });

			return result;
		}),

	by_multiple_genres: publicProcedure
		.input(
			z.object({
				genreIds: z.array(z.number().int().positive()).min(1),
				limit: z.number().int().positive().optional().default(20),
				offset: z.number().int().min(0).optional().default(0),
			}),
		)
		.query(async ({ input }) => {
			const cacheKey = `igdb:by_multiple_genres:${input.genreIds.sort().join(",")}:${input.limit}:${input.offset}`;

			const cached = await cache.get(cacheKey);
			if (cached) return cached;

			const result = await igdb.byMultipleGenres(
				input.genreIds,
				input.limit,
				input.offset,
			);
			await cache.set(cacheKey, result, { ttl: CACHE_TTL.DYNAMIC });

			return result;
		}),

	similar_games: publicProcedure
		.input(
			z.object({
				gameId: z.string(),
				limit: z.number().int().positive().optional().default(20),
				offset: z.number().int().min(0).optional().default(0),
			}),
		)
		.query(async ({ input }) => {
			const cacheKey = `igdb:similar_games:${input.gameId}:${input.limit}:${input.offset}`;

			const cached = await cache.get(cacheKey);
			if (cached) return cached;

			const result = await igdb.similarGames(
				input.gameId,
				input.limit,
				input.offset,
			);
			await cache.set(cacheKey, result, { ttl: CACHE_TTL.GAME_INFO });

			return result;
		}),

	genres: publicProcedure
		.input(
			z.object({
				limit: z.number().int().positive().optional().default(20),
				offset: z.number().int().min(0).optional().default(0),
			}),
		)
		.query(async ({ input }) => {
			const cacheKey = `igdb:genres:${input.limit}:${input.offset}`;

			const cached = await cache.get(cacheKey);
			if (cached) return cached;

			const result = await igdb.getGenres(input.limit, input.offset);
			await cache.set(cacheKey, result, { ttl: CACHE_TTL.STATIC });

			return result;
		}),

	companies: publicProcedure
		.input(
			z.object({
				ids: z.array(z.number().int().positive()),
			}),
		)
		.query(async ({ input }) => {
			const cacheKey = `igdb:companies:${input.ids.sort().join(",")}`;

			const cached = await cache.get(cacheKey);
			if (cached) return cached;

			const result = await igdb.getCompanies(input.ids);
			await cache.set(cacheKey, result, { ttl: CACHE_TTL.STATIC });

			return result;
		}),

	themes: publicProcedure
		.input(
			z.object({
				limit: z.number().int().positive().optional().default(20),
				offset: z.number().int().min(0).optional().default(0),
			}),
		)
		.query(async ({ input }) => {
			const cacheKey = `igdb:themes:${input.limit}:${input.offset}`;

			const cached = await cache.get(cacheKey);
			if (cached) return cached;

			const result = await igdb.getThemes(input.limit, input.offset);
			await cache.set(cacheKey, result, { ttl: CACHE_TTL.STATIC });

			return result;
		}),

	game_modes: publicProcedure
		.input(
			z.object({
				limit: z.number().int().positive().optional().default(20),
				offset: z.number().int().min(0).optional().default(0),
			}),
		)
		.query(async ({ input }) => {
			const cacheKey = `igdb:game_modes:${input.limit}:${input.offset}`;

			const cached = await cache.get(cacheKey);
			if (cached) return cached;

			const result = await igdb.getGameModes(input.limit, input.offset);
			await cache.set(cacheKey, result, { ttl: CACHE_TTL.STATIC });

			return result;
		}),

	filter: publicProcedure
		.input(
			z.object({
				limit: z.number().int().positive().optional().default(20),
				offset: z.number().int().min(0).optional().default(0),
				sort: z.string().optional(),
				platforms: z.array(z.number().int().positive()).optional(),
				genreIds: z.array(z.number().int().positive()).optional(),
				themes: z.array(z.number().int().positive()).optional(),
				gameModes: z.array(z.number().int().positive()).optional(),
				playerPerspectiveIds: z.array(z.number().int().positive()).optional(),
				minRating: z.number().min(0).max(100).optional(),
				maxRating: z.number().min(0).max(100).optional(),
				minRatingCount: z.number().int().min(0).optional(),
				releaseDateFrom: z.number().int().positive().optional(),
				releaseDateTo: z.number().int().positive().optional(),
				minHypes: z.number().int().min(0).optional(),
				onlyMainGames: z.boolean().optional(),
				excludeVersions: z.boolean().optional(),
				developerIds: z.array(z.number().int().positive()).optional(),
				publisherIds: z.array(z.number().int().positive()).optional(),
			}),
		)
		.query(async ({ input }) => {
			const { limit, offset, sort, ...filters } = input;

			// Create a stable cache key from the filter parameters
			const filterKey = JSON.stringify({
				filters: Object.fromEntries(
					Object.entries(filters).sort(([a], [b]) => a.localeCompare(b)),
				),
				sort,
				limit,
				offset,
			});
			const cacheKey = `igdb:filter:${Buffer.from(filterKey).toString("base64")}`;

			const cached = await cache.get(cacheKey);
			if (cached) return cached;

			const result = await igdb.filter(filters, sort, limit, offset);
			await cache.set(cacheKey, result, { ttl: CACHE_TTL.DYNAMIC });

			return result;
		}),

	calendarReleases: publicProcedure
		.input(
			z.object({
				year: z.number().int().min(1970).max(2100),
				month: z.number().int().min(0).max(11),
				limit: z.number().int().positive().optional().default(100),
				offset: z.number().int().min(0).optional().default(0),
			}),
		)
		.query(async ({ input }) => {
			const { year, month, limit, offset } = input;
			const cacheKey = `igdb:calendar:${year}:${month}:${limit}:${offset}`;

			const cached = await cache.get(cacheKey);
			if (cached) return cached;

			const startDate = new Date(year, month, 1).getTime();
			const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();

			const filters: GameFilters = {
				releaseDateFrom: startDate,
				releaseDateTo: endDate,
				onlyMainGames: true,
				excludeVersions: true,
				minHypes: 1,
			};

			const result = await igdb.filter(
				filters,
				"first_release_date asc",
				limit,
				offset,
			);
			await cache.set(cacheKey, result, { ttl: CACHE_TTL.CALENDAR });

			return result;
		}),
});
