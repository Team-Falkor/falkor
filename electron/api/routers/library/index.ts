import { publicProcedure, router } from "@backend/api/trpc";
import { libraryGames, listsToGames } from "@backend/database/schemas";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, type InferInsertModel } from "drizzle-orm";
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

	recentGames: publicProcedure
		.input(
			z.object({
				limit: z.number().min(1).default(20),
			}),
		)
		.query(async ({ input, ctx }) => {
			return await ctx.db
				.select()
				.from(libraryGames)
				.limit(input.limit)
				.where(eq(libraryGames.installed, true))
				.orderBy(desc(libraryGames.gameLastPlayed));
		}),

	create: publicProcedure
		.input(
			z.object({
				gameName: z.string(),
				gamePath: z.string(),
				gameId: z.string().optional(),
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
				runAsAdmin: z.boolean().optional().default(false),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const gameId = !input.gameId ? crypto.randomUUID() : input.gameId;
			const toInsert: InferInsertModel<typeof libraryGames> = {
				...input,
				gameLastPlayed: input.gameLastPlayed ?? null,
				gameId,
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
					runAsAdmin: z.boolean().optional(),
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
		.input(z.object({ gameId: z.string() }))
		.mutation(async ({ input, ctx }) => {
			try {
				const game = ctx.db
					.select({ id: libraryGames.id })
					.from(libraryGames)
					.where(eq(libraryGames.gameId, input.gameId))
					.get();

				if (!game) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: `Game with gameId '${input.gameId}' not found.`,
					});
				}

				ctx.db
					.delete(listsToGames)
					.where(eq(listsToGames.gameId, game.id))
					.run();

				const [deletedGame] = await ctx.db
					.delete(libraryGames)
					.where(eq(libraryGames.id, game.id))
					.returning();

				return deletedGame ?? null;
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}

				console.error("Failed to delete game:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "An unexpected error occurred while deleting the game.",
					cause: error instanceof Error ? error : undefined,
				});
			}
		}),
});
