import { EventEmitter } from "node:events";
import { publicProcedure, router } from "@backend/api/trpc";
import { libraryGames } from "@backend/database/schemas";
import GameProcessLauncher from "@backend/handlers/launcher/game-process-launcher";
import { gamesLaunched } from "@backend/handlers/launcher/games-launched";
import { emitOnce } from "@backend/utils/emit-once";
import { getErrorMessage } from "@backend/utils/utils";
import { eq } from "drizzle-orm";
import { z } from "zod";

const emitter = new EventEmitter();

const eventListeners = new WeakMap<
	GameProcessLauncher,
	{ onPlaying: (gameId: string) => void; onStopped: (gameId: string) => void }
>();

const launchInputSchema = z.object({
	gameId: z.string(),
	args: z.array(z.string()).optional(),
});

export const gameLauncherRouter = router({
	launch: publicProcedure
		.input(launchInputSchema)
		.mutation(async ({ input, ctx }) => {
			const game = await ctx.db
				.select()
				.from(libraryGames)
				.where(eq(libraryGames.gameId, input.gameId))
				.get();

			if (!game) return { success: false, error: "Game not found" };
			if (!game.gamePath)
				return { success: false, error: "Game path not found" };

			const launcher = new GameProcessLauncher({
				gameId: game.gameId,
				gamePath: game.gamePath,
				gameName: game.gameName,
				gameIcon: game.gameIcon ?? undefined,
				steamId: game.gameSteamId ?? undefined,
				gameArgs: input.args,
				commandOverride: game.gameCommand ?? undefined,
				winePrefixPath: game.winePrefixFolder ?? undefined,
			});

			if (game.runAsAdmin) {
				try {
					await launcher.launchAsAdmin(input.args);
					return { success: true };
				} catch (error) {
					return { success: false, error: getErrorMessage(error) };
				}
			}

			const listeners = {
				onPlaying: (gameId: string) => emitter.emit("game:playing", gameId),
				onStopped: (gameId: string) => emitter.emit("game:stopped", gameId),
			};
			eventListeners.set(launcher, listeners);

			launcher.on("game:playing", listeners.onPlaying);
			launcher.on("game:stopped", listeners.onStopped);

			try {
				launcher.launch(input.args);
				return { success: true };
			} catch (error) {
				const storedListeners = eventListeners.get(launcher);
				if (storedListeners) {
					launcher.off("game:playing", storedListeners.onPlaying);
					launcher.off("game:stopped", storedListeners.onStopped);
					eventListeners.delete(launcher);
				}
				throw error;
			}
		}),

	stop: publicProcedure
		.input(z.object({ gameId: z.string() }))
		.mutation(({ input }) => {
			const launcher = gamesLaunched.get(input.gameId);
			if (launcher) {
				launcher.stop();
				return { success: true };
			}
			return { success: false, error: "Game not running" };
		}),

	isRunning: publicProcedure
		.input(z.object({ gameId: z.string() }))
		.query(({ input }) => {
			return { running: gamesLaunched.has(input.gameId) };
		}),

	getRunning: publicProcedure.query(() => {
		return Array.from(gamesLaunched.keys());
	}),

	onGameStateChange: publicProcedure.subscription(async function* () {
		const cleanup = () => {
			emitter.removeAllListeners("game:playing");
			emitter.removeAllListeners("game:stopped");
			for (const launcher of gamesLaunched.values()) {
				const listeners = eventListeners.get(launcher);
				if (listeners) {
					launcher.off("game:playing", listeners.onPlaying);
					launcher.off("game:stopped", listeners.onStopped);
					eventListeners.delete(launcher);
				}
			}
		};

		try {
			while (true) {
				const result = await Promise.race([
					emitOnce<string>(emitter, "game:playing").then((gameId) => ({
						type: "playing" as const,
						gameId,
					})),
					emitOnce<string>(emitter, "game:stopped").then((gameId) => ({
						type: "stopped" as const,
						gameId,
					})),
				]);

				yield result;
			}
		} catch (error) {
			cleanup();
			throw error;
		} finally {
			cleanup();
		}
	}),
});

export type GameLauncherRouter = typeof gameLauncherRouter;
