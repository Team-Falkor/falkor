import { publicProcedure, router } from "@backend/api/trpc";
import { libraryGames } from "@backend/database/schemas";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const libraryGamesRouter = router({
	list: publicProcedure
		.input(
			z.object({
				limit: z.number().min(1).default(20),
				offset: z.number().min(0).default(0),
			}),
		)
		.query(({ input, ctx }) => {
			return ctx.db
				.select()
				.from(libraryGames)
				.limit(input.limit)
				.offset(input.offset);
		}),

	getById: publicProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ input, ctx }) => {
			const rows = await ctx.db
				.select()
				.from(libraryGames)
				.where(eq(libraryGames.id, input.id));
			return rows[0] || null;
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
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const toInsert = {
				...input,
				gameLastPlayed: input.gameLastPlayed ?? null,
			};
			const [created] = await ctx.db
				.insert(libraryGames)
				.values([toInsert])
				.returning();
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
			const [deleted] = await ctx.db
				.delete(libraryGames)
				.where(eq(libraryGames.id, input.id))
				.returning();
			return deleted;
		}),
});
