import { z } from "zod";
import { publicProcedure, router } from "../../../api/trpc";
import { IGDBWrapper } from "../../../handlers/api-wrappers/igdb";

const igdb = IGDBWrapper.getInstance();

export const igdbRouter = router({
	search: publicProcedure
		.input(
			z.object({
				query: z.string(),
				limit: z.number().default(20),
				offset: z.number().default(0),
			}),
		)
		.query(async ({ input }) => {
			return await igdb.search(input.query, input.limit, input.offset);
		}),

	info: publicProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ input }) => {
			return await igdb.info(input.id);
		}),

	top_rated: publicProcedure
		.input(
			z.object({
				limit: z.number().default(20),
				offset: z.number().default(0),
			}),
		)
		.query(async ({ input }) => {
			return await igdb.topRated(input.limit, input.offset);
		}),

	new_releases: publicProcedure
		.input(
			z.object({
				limit: z.number().default(20),
				offset: z.number().default(0),
			}),
		)
		.query(async ({ input }) => {
			return await igdb.newReleases(input.limit, input.offset);
		}),

	most_anticipated: publicProcedure
		.input(
			z.object({
				limit: z.number().default(20),
				offset: z.number().default(0),
			}),
		)
		.query(async ({ input }) => {
			return await igdb.mostAnticipated(input.limit, input.offset);
		}),

	by_genre: publicProcedure
		.input(
			z.object({
				genre: z.string(),
				limit: z.number().default(20),
				offset: z.number().default(0),
			}),
		)
		.query(async ({ input }) => {
			return await igdb.byGenre(input.genre, input.limit, input.offset);
		}),

	by_multiple_genres: publicProcedure
		.input(
			z.object({
				genreIds: z.array(z.number()),
				limit: z.number().default(20),
				offset: z.number().default(0),
			}),
		)
		.query(async ({ input }) => {
			return await igdb.byMultipleGenres(
				input.genreIds,
				input.limit,
				input.offset,
			);
		}),

	similar_games: publicProcedure
		.input(
			z.object({
				gameId: z.string(),
				limit: z.number().default(20),
				offset: z.number().default(0),
			}),
		)
		.query(async ({ input }) => {
			return await igdb.similarGames(input.gameId, input.limit, input.offset);
		}),

	top_rated_new_releases: publicProcedure
		.input(
			z.object({
				limit: z.number().default(20),
				offset: z.number().default(0),
				minRating: z.number().default(75),
			}),
		)
		.query(async ({ input }) => {
			return await igdb.topRatedNewReleases(
				input.limit,
				input.offset,
				input.minRating,
			);
		}),

	genres: publicProcedure
		.input(
			z.object({
				limit: z.number().default(20),
				offset: z.number().default(0),
			}),
		)
		.query(async ({ input }) => {
			return await igdb.getGenres(input.limit, input.offset);
		}),

	themes: publicProcedure
		.input(
			z.object({
				limit: z.number().default(20),
				offset: z.number().default(0),
			}),
		)
		.query(async ({ input }) => {
			return await igdb.getThemes(input.limit, input.offset);
		}),

	filter: publicProcedure
		.input(
			z.object({
				options: z.object({
					sort: z.string().optional(),
					platforms: z.array(z.number()).optional(),
					genreIds: z.array(z.number()).optional(),
					themes: z.array(z.number()).optional(),
					gameModes: z.array(z.number()).optional(),
					playerPerspectiveIds: z.array(z.number()).optional(),
					minRating: z.number().optional(),
					maxRating: z.number().optional(),
					minRatingCount: z.number().optional(),
					releaseDateFrom: z.number().optional(),
					releaseDateTo: z.number().optional(),
					minHypes: z.number().optional(),
					onlyMainGames: z.boolean().optional(),
					excludeVersions: z.boolean().optional(),
				}),
				limit: z.number().default(20),
				offset: z.number().default(0),
			}),
		)
		.query(async ({ input }) => {
			const { sort, ...filters } = input.options;
			return await igdb.filter(filters, sort, input.limit, input.offset);
		}),

	calendarReleases: publicProcedure
		.input(
			z.object({
				year: z.number(), // e.g. 2025
				month: z.number().min(0).max(11), // 0 = January, 11 = December
				limit: z.number().default(100),
				offset: z.number().default(0),
			}),
		)
		.query(async ({ input }) => {
			const { year, month, limit, offset } = input;
			const startDate = Math.floor(new Date(year, month, 1).getTime() / 1000);
			const endDate = Math.floor(new Date(year, month + 1, 1).getTime() / 1000);

			return await igdb.filter(
				{
					releaseDateFrom: startDate * 1000,
					releaseDateTo: endDate * 1000,
					onlyMainGames: true,
				},
				"release_dates.date desc",
				limit,
				offset,
			);
		}),
});
