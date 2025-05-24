import { publicProcedure, router } from "@backend/api/trpc";
import { libraryGames, listsToGames } from "@backend/database/schemas";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

export const libraryGamesRouter = router({
	list: publicProcedure
		.input(
			z.object({
				limit: z.number().min(1).default(20),
				offset: z.number().min(0).default(0),
			}),
		)
		.query(async ({ input, ctx }) => {
			return await ctx.db
				.select()
				.from(libraryGames)
				.limit(input.limit)
				.offset(input.offset)
				.where(eq(libraryGames.installed, true))
				.orderBy(desc(libraryGames.gamePlaytime));
		}),

	getById: publicProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ input, ctx }) => {
			const row = ctx.db
				.select()
				.from(libraryGames)
				.where(
					and(eq(libraryGames.id, input.id), eq(libraryGames.installed, true)),
				)
				.get();
			return row;
		}),

	create: publicProcedure
		.input(
			z.object({
				gameName: z.string(),
				gamePath: z.string(),
				gameId: z.string(),
				gameSteamId: z.string().optional(),
				gameIcon: z.string().optional(),
				gameArgs: z.string().optional(),
				gameCommand: z.string().optional(),
				winePrefixFolder: z.string().optional(),
				gamePlaytime: z.number().int().min(0).default(0),
				gameLastPlayed: z
					.number()
					.int()
					.optional()
					.transform((val) => (val ? new Date(val) : undefined)),
				igdbId: z.number().int().optional(),
				installed: z.boolean().default(true),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const toInsert = {
				...input,
				gameLastPlayed: input.gameLastPlayed ?? null,
			};
			const created = ctx.db
				.insert(libraryGames)
				.values([toInsert])
				.returning()
				.get();
			return created;
		}),

	update: publicProcedure
		.input(
			z.object({
				id: z.number(),
				data: z.object({
					gameName: z.string().optional(),
					gamePath: z.string().optional(),
					gameId: z.string().optional(),
					gameSteamId: z.string().optional(),
					gameIcon: z.string().optional(),
					gameArgs: z.string().optional(),
					gameCommand: z.string().optional(),
					winePrefixFolder: z.string().optional(),
					gamePlaytime: z.number().int().min(0).optional(),
					gameLastPlayed: z
						.number()
						.int()
						.optional()
						.transform((val) => (val ? new Date(val) : undefined)),
					igdbId: z.number().int().optional(),
					installed: z.boolean().optional(),
				}),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const updates = {
				...input.data,
				gameLastPlayed: input.data.gameLastPlayed ?? undefined,
			};
			const [updated] = await ctx.db
				.update(libraryGames)
				.set(updates)
				.where(eq(libraryGames.id, input.id))
				.returning();
			return updated;
		}),

	delete: publicProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ input, ctx }) => {
			// First, delete associations in listsToGames
			await ctx.db
				.delete(listsToGames) // Assuming 'listsToGames' schema is imported
				.where(eq(listsToGames.gameId, input.id));

			// Then, delete the game itself
			const [deleted] = await ctx.db
				.delete(libraryGames)
				.where(eq(libraryGames.id, input.id))
				.returning();
			return deleted;
		}),
});
