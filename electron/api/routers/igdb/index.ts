import { z } from "zod";
import { publicProcedure, router } from "../../../api/trpc";
import {
	type GameFilters,
	IGDBWrapper,
} from "../../../handlers/api-wrappers/igdb";

const igdb = IGDBWrapper.getInstance();

export const igdbRouter = router({
	search: publicProcedure
		.input(
			z.object({
				query: z.string().min(1, "Search query cannot be empty"),
				limit: z.number().int().positive().optional().default(20),
				offset: z.number().int().min(0).optional().default(0),
			}),
		)
		.query(({ input }) => igdb.search(input.query, input.limit, input.offset)),

	info: publicProcedure
		.input(z.object({ id: z.string() }))
		.query(({ input }) => igdb.info(input.id)),

	top_rated: publicProcedure
		.input(
			z.object({
				limit: z.number().int().positive().optional().default(20),
				offset: z.number().int().min(0).optional().default(0),
			}),
		)
		.query(({ input }) => igdb.topRated(input.limit, input.offset)),

	new_releases: publicProcedure
		.input(
			z.object({
				limit: z.number().int().positive().optional().default(20),
				offset: z.number().int().min(0).optional().default(0),
			}),
		)
		.query(({ input }) => igdb.newReleases(input.limit, input.offset)),

	most_anticipated: publicProcedure
		.input(
			z.object({
				limit: z.number().int().positive().optional().default(20),
				offset: z.number().int().min(0).optional().default(0),
			}),
		)
		.query(({ input }) => igdb.mostAnticipated(input.limit, input.offset)),

	by_genre: publicProcedure
		.input(
			z.object({
				genre: z.string(),
				limit: z.number().int().positive().optional().default(20),
				offset: z.number().int().min(0).optional().default(0),
			}),
		)
		.query(({ input }) => igdb.byGenre(input.genre, input.limit, input.offset)),

	by_multiple_genres: publicProcedure
		.input(
			z.object({
				genreIds: z.array(z.number().int().positive()).min(1),
				limit: z.number().int().positive().optional().default(20),
				offset: z.number().int().min(0).optional().default(0),
			}),
		)
		.query(({ input }) =>
			igdb.byMultipleGenres(input.genreIds, input.limit, input.offset),
		),

	similar_games: publicProcedure
		.input(
			z.object({
				gameId: z.string(),
				limit: z.number().int().positive().optional().default(20),
				offset: z.number().int().min(0).optional().default(0),
			}),
		)
		.query(({ input }) =>
			igdb.similarGames(input.gameId, input.limit, input.offset),
		),

	genres: publicProcedure
		.input(
			z.object({
				limit: z.number().int().positive().optional().default(20),
				offset: z.number().int().min(0).optional().default(0),
			}),
		)
		.query(({ input }) => igdb.getGenres(input.limit, input.offset)),

	companies: publicProcedure
		.input(
			z.object({
				ids: z.array(z.number().int().positive()),
			}),
		)
		.query(({ input }) => {
			return igdb.getCompanies(input.ids);
		}),

	themes: publicProcedure
		.input(
			z.object({
				limit: z.number().int().positive().optional().default(20),
				offset: z.number().int().min(0).optional().default(0),
			}),
		)
		.query(({ input }) => igdb.getThemes(input.limit, input.offset)),

	game_modes: publicProcedure
		.input(
			z.object({
				limit: z.number().int().positive().optional().default(20),
				offset: z.number().int().min(0).optional().default(0),
			}),
		)
		.query(({ input }) => igdb.getGameModes(input.limit, input.offset)),

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
		.query(({ input }) => {
			const { limit, offset, sort, ...filters } = input;
			return igdb.filter(filters, sort, limit, offset);
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
		.query(({ input }) => {
			const { year, month, limit, offset } = input;
			const startDate = new Date(year, month, 1).getTime();
			const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();

			const filters: GameFilters = {
				releaseDateFrom: startDate,
				releaseDateTo: endDate,
				onlyMainGames: true,
				excludeVersions: true,
				minHypes: 1,
			};

			return igdb.filter(filters, "first_release_date asc", limit, offset);
		}),
});
