import { normalizeGameIcon } from "@backend/utils/utils";
import { TRPCError } from "@trpc/server";
import type Database from "better-sqlite3";
import { and, eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { z } from "zod";
import { publicProcedure, router } from "../../../api/trpc";
import { libraryGames, lists, listsToGames } from "../../../database/schemas";

interface Context {
	db: BetterSQLite3Database<typeof import("../../../database/schemas")> & {
		$client: Database.Database;
	};
}

type LibraryGame = typeof libraryGames.$inferSelect;

async function fetchListWithGames(
	ctx: Context,
	listId: number,
): Promise<{
	id: number;
	name: string;
	description: string | null;
	games: LibraryGame[];
}> {
	const rows = await ctx.db
		.select({
			listId: lists.id,
			listName: lists.name,
			listDesc: lists.description,
			game: libraryGames,
		})
		.from(lists)
		.leftJoin(listsToGames, eq(listsToGames.listId, lists.id))
		.leftJoin(libraryGames, eq(libraryGames.id, listsToGames.gameId))
		.where(eq(lists.id, listId));

	if (rows.length === 0) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: `List with ID ${listId} not found`,
		});
	}

	const { listName, listDesc } = rows[0];
	const games: LibraryGame[] = [];

	for (const { game } of rows) {
		if (game != null) {
			games.push({
				id: game.id,
				gameName: game.gameName,
				gamePath: game.gamePath,
				gameId: game.gameId,
				gameSteamId: game.gameSteamId ?? null,
				gameIcon: game.gameIcon ?? null,
				gameArgs: game.gameArgs ?? null,
				gameCommand: game.gameCommand ?? null,
				winePrefixFolder: game.winePrefixFolder ?? null,
				gamePlaytime: game.gamePlaytime,
				gameLastPlayed: game.gameLastPlayed,
				igdbId: game.igdbId ?? null,
				installed: game.installed ?? !!game.gamePath?.length,
				runAsAdmin: game.runAsAdmin,
			});
		}
	}

	return {
		id: listId,
		name: listName,
		description: listDesc ?? null,
		games,
	};
}

function handleDbConstraintError(
	error: unknown,
	conflictMessage: string,
): never {
	if (error instanceof Error) {
		// Check for foreign key constraint errors first
		if (
			error.message?.toLowerCase().includes("foreign key constraint failed")
		) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message:
					"Foreign key constraint failed. The referenced entity may not exist.",
			});
		}

		// Then check for other constraint errors
		if (error.name === "SQLITE_CONSTRAINT") {
			throw new TRPCError({ code: "CONFLICT", message: conflictMessage });
		}
	}
	throw error;
}

async function withTransaction<T>(
	ctx: Context,
	callback: () => Promise<T>,
): Promise<T> {
	const client = ctx.db.$client;
	try {
		client.exec("BEGIN TRANSACTION");
		const result = await callback();
		client.exec("COMMIT");
		return result;
	} catch (error) {
		client.exec("ROLLBACK");
		throw error;
	}
}

export const listsRouter = router({
	getAll: publicProcedure.query(async ({ ctx }) => {
		const rows = await ctx.db
			.select({
				listId: lists.id,
				listName: lists.name,
				listDesc: lists.description,
				game: libraryGames,
			})
			.from(lists)
			.leftJoin(listsToGames, eq(listsToGames.listId, lists.id))
			.leftJoin(libraryGames, eq(libraryGames.id, listsToGames.gameId));

		const map = new Map<
			number,
			{
				id: number;
				name: string;
				description: string | null;
				games: LibraryGame[];
			}
		>();

		for (const { listId, listName, listDesc, game } of rows) {
			if (!map.has(listId)) {
				map.set(listId, {
					id: listId,
					name: listName,
					description: listDesc ?? null,
					games: [],
				});
			}
			if (game != null) {
				map.get(listId)?.games.push({
					id: game.id,
					gameName: game.gameName,
					gamePath: game.gamePath,
					gameId: game.gameId,
					gameSteamId: game.gameSteamId ?? null,
					gameIcon: game.gameIcon ?? null,
					gameArgs: game.gameArgs ?? null,
					gameCommand: game.gameCommand ?? null,
					winePrefixFolder: game.winePrefixFolder ?? null,
					gamePlaytime: game.gamePlaytime,
					gameLastPlayed: game.gameLastPlayed,
					igdbId: game.igdbId ?? null,
					installed: game.installed ?? !!game.gamePath?.length,
					runAsAdmin: game.runAsAdmin,
				});
			}
		}

		return Array.from(map.values());
	}),

	getById: publicProcedure
		.input(z.number())
		.query(({ input, ctx }) => fetchListWithGames(ctx, input)),

	getByIdWithGames: publicProcedure
		.input(z.number())
		.query(({ input, ctx }) => fetchListWithGames(ctx, input)),

	create: publicProcedure
		.input(
			z.object({ name: z.string().min(1), description: z.string().optional() }),
		)
		.mutation(async ({ input, ctx }) => {
			return withTransaction(ctx, async () => {
				try {
					const created = ctx.db.insert(lists).values(input).returning().get();

					return {
						id: created.id,
						name: created.name,
						description: created.description ?? null,
						games: [],
					};
				} catch (err) {
					handleDbConstraintError(
						err,
						`List with name '${input.name}' already exists`,
					);
				}
			});
		}),

	update: publicProcedure
		.input(
			z.object({
				id: z.number(),
				name: z.string().min(1).optional(),
				description: z.string().optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			// Verify list exists before attempting update
			await fetchListWithGames(ctx, input.id);

			return withTransaction(ctx, async () => {
				try {
					await ctx.db.update(lists).set(input).where(eq(lists.id, input.id));
				} catch (err: unknown) {
					handleDbConstraintError(
						err,
						`List with name '${input.name}' already exists`,
					);
				}
				return fetchListWithGames(ctx, input.id);
			});
		}),

	delete: publicProcedure.input(z.number()).mutation(async ({ input, ctx }) => {
		return withTransaction(ctx, async () => {
			// Delete related entries in listsToGames first to maintain referential integrity
			await ctx.db.delete(listsToGames).where(eq(listsToGames.listId, input));

			// Then delete the list itself
			const deleted = await ctx.db
				.delete(lists)
				.where(eq(lists.id, input))
				.returning();

			return { success: deleted.length > 0, id: input };
		});
	}),

	addGame: publicProcedure
		.input(
			z.object({
				listId: z.number(),
				gameId: z.number(),
				gameName: z.string(),
				gameIcon: z.string().optional(),
				gameSteamId: z.string().optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			// Verify list exists before proceeding
			await fetchListWithGames(ctx, input.listId);

			return withTransaction(ctx, async () => {
				try {
					// Check if game exists
					const gameExists = await ctx.db
						.select()
						.from(libraryGames)
						.where(eq(libraryGames.id, input.gameId))
						.get();

					// Create game if it doesn't exist
					if (!gameExists) {
						// Ensure we have the minimum required fields for a game
						if (!input.gameName) {
							throw new TRPCError({
								code: "BAD_REQUEST",
								message: "Game name is required to create a new game",
							});
						}

						const gameIconNormalized = normalizeGameIcon(input.gameIcon);

						// Create a new game with required fields and defaults for missing fields
						await ctx.db
							.insert(libraryGames)
							.values({
								id: input.gameId, // Explicitly set ID to match the one we're trying to add
								gameName: input.gameName,
								gameId: input.gameId.toString(),
								gameIcon: gameIconNormalized,
								gameSteamId: input.gameSteamId,
								igdbId: input.gameId,
								gamePlaytime: 0,
							})
							.returning();
					}

					// Add game to list
					try {
						await ctx.db.insert(listsToGames).values({
							listId: input.listId,
							gameId: input.gameId,
						});
					} catch (err: unknown) {
						handleDbConstraintError(err, "Game already in list");
					}

					return fetchListWithGames(ctx, input.listId);
				} catch (error) {
					// Handle any errors that might occur during the transaction
					if (error instanceof TRPCError) {
						throw error; // Re-throw TRPC errors
					}

					// Handle other database errors
					if (
						error instanceof Error &&
						error?.message
							?.toLowerCase()
							?.includes("foreign key constraint failed")
					) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message:
								"Failed to add game to list. The game or list may not exist.",
						});
					}
					console.log(error);

					// For any other errors
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message:
							"An unexpected error occurred while adding the game to the list",
					});
				}
			});
		}),

	removeGame: publicProcedure
		.input(z.object({ listId: z.number(), gameId: z.number() }))
		.mutation(async ({ input, ctx }) => {
			// Verify list exists before proceeding
			await fetchListWithGames(ctx, input.listId);

			return withTransaction(ctx, async () => {
				try {
					// Remove game from list
					const result = await ctx.db
						.delete(listsToGames)
						.where(
							and(
								eq(listsToGames.listId, input.listId),
								eq(listsToGames.gameId, input.gameId),
							),
						)
						.returning();

					// Check if any rows were affected
					if (result.length === 0) {
						// Game wasn't in the list, but we'll just return the current list state
						// This makes the API more idempotent
					}

					return fetchListWithGames(ctx, input.listId);
				} catch (error) {
					// Handle any errors that might occur during the transaction
					if (error instanceof TRPCError) {
						throw error; // Re-throw TRPC errors
					}

					// For any other errors
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message:
							"An unexpected error occurred while removing the game from the list",
					});
				}
			});
		}),
});
