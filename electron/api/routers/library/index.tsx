import { publicProcedure, router } from "@backend/api/trpc";
import { libraryGames, listsToGames } from "@backend/database/schemas";
import { TRPCError } from "@trpc/server";
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

	// --- Assuming necessary imports ---
	// import { publicProcedure } from "../trpc"; // Adjust path as needed
	// import { z } from "zod";
	// import { eq } from "drizzle-orm";
	// import { listsToGames, libraryGames } from "../db/schema"; // Adjust path to your Drizzle schema
	// import { TRPCError } from "@trpc/server";

	delete: publicProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ input, ctx }) => {
			try {
				const deletedGameRecord = await ctx.db.transaction((tx) => {
					tx.delete(listsToGames)
						.where(eq(listsToGames.gameId, input.id))
						.run();

					const deletedGames = tx
						.delete(libraryGames)
						.where(eq(libraryGames.gameId, input.id.toString()))
						.returning()
						.get();

					return deletedGames;
				});

				return deletedGameRecord;
			} catch (error) {
				console.error("Failed to delete game:", error);

				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "An unexpected error occurred while deleting the game.",
					cause: error instanceof Error ? error : undefined,
				});
			}
		}),
});
