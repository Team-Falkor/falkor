import { publicProcedure, router } from "@backend/api/trpc";
import { libraryGames } from "@backend/database/schemas";
import GameProcessLauncher from "@backend/handlers/launcher/game-process-launcher";
import { gameLauncher } from "@backend/handlers/launcher/launcher";
import { eq } from "drizzle-orm";
import { z } from "zod";

/**
 * Validation schema
 */
const idSchema = z.number().int().positive();
const gameIdSchema = z.string().min(1);
const argsSchema = z.array(z.string()).optional();

const launchInputSchema = z.object({
	id: idSchema,
	args: argsSchema,
});

export const gameLauncherRouter = router({
	launchGame: publicProcedure
		.input(launchInputSchema)
		.mutation(async ({ input, ctx }) => {
			console.log(input);
			// Get game data
			const game = ctx.db
				.select()
				.from(libraryGames)
				.where(eq(libraryGames.id, input.id))
				.get();

			if (!game) {
				return { success: false, error: "Game not found" };
			}
			if (!game.gamePath) {
				return { success: false, error: "Game path not found" };
			}

			const launcher = new GameProcessLauncher({
				id: game.id,
				gameId: game.gameId,
				gamePath: game.gamePath,
				gameName: game.gameName,
				gameIcon: game.gameIcon ?? undefined,
				steamId: game.gameSteamId ?? undefined,
				gameArgs: input.args,
				commandOverride: game.gameCommand ?? undefined,
				winePrefixPath: game.winePrefixFolder ?? undefined,
				runAsAdmin: game.runAsAdmin ?? false,
				useProton: game.useProton ?? false,
				protonVariant: game.protonVariant ?? undefined,
				protonVersion: game.protonVersion ?? undefined,
			});

			await launcher.launchGame();
		}),

	closeGame: publicProcedure.input(gameIdSchema).mutation(async ({ input }) => {
		await gameLauncher.closeGame(input);
	}),

	getRunningGames: publicProcedure.query(async () => {
		const runningGames = gameLauncher.getRunningGames();
		return { runningGames };
	}),

	getGameInfo: publicProcedure.input(gameIdSchema).query(async ({ input }) => {
		const gameInfo = gameLauncher.getGameInfo(input);
		return { gameInfo };
	}),

	isGameRunning: publicProcedure
		.input(gameIdSchema)
		.query(async ({ input }) => {
			const isRunning = gameLauncher.isGameRunning(input);
			return { isRunning };
		}),
});
