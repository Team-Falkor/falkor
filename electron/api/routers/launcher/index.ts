import { EventEmitter } from "node:events";
import { publicProcedure, router } from "@backend/api/trpc";
import { libraryGames } from "@backend/database/schemas";
import GameProcessLauncher from "@backend/handlers/launcher/game-process-launcher";
import { gamesLaunched } from "@backend/handlers/launcher/games-launched";
import logger from "@backend/handlers/logging";
import { emitOnce } from "@backend/utils/emit-once";
import { eq } from "drizzle-orm";
import { z } from "zod";

const emitter = new EventEmitter();
// Store event listeners in a WeakMap to allow garbage collection
const eventListeners = new WeakMap<
	GameProcessLauncher,
	{ onPlaying: (id: number) => void; onStopped: (id: number) => void }
>();

const launchInputSchema = z.object({
	id: z.number(),
	args: z.array(z.string()).optional(),
});

export const gameLauncherRouter = router({
	launch: publicProcedure
		.input(launchInputSchema)
		.mutation(async ({ input, ctx }) => {
			const game = await ctx.db
				.select()
				.from(libraryGames)
				.where(eq(libraryGames.id, input.id))
				.get();

			if (!game) return { success: false, error: "Game not found" };
			if (!game.gamePath)
				return { success: false, error: "Game path not found" };

			// Check if game is already running
			const existingLauncher = gamesLaunched.get(input.id);
			if (existingLauncher) {
				const isRunning = await existingLauncher.isRunning();
				if (isRunning) {
					return { success: false, error: "Game is already running" };
				}
				// Clean up stale launcher
				existingLauncher.stop();
			}

			const launcher = new GameProcessLauncher({
				id: game.id,
				gamePath: game.gamePath,
				gameName: game.gameName,
				gameIcon: game.gameIcon ?? undefined,
				steamId: game.gameSteamId ?? undefined,
				gameArgs: input.args,
				commandOverride: game.gameCommand ?? undefined,
				winePrefixPath: game.winePrefixFolder ?? undefined,
				runAsAdmin: game.runAsAdmin ?? false,
			});

			// Create and store event listeners
			const listeners = {
				onPlaying: (id: number) => {
					logger.log("info", `Game ${id} started playing`);
					emitter.emit("game:playing", id);
				},
				onStopped: (id: number) => {
					logger.log("info", `Game ${id} stopped`);
					emitter.emit("game:stopped", id);
					// Clean up listeners when game stops
					const storedListeners = eventListeners.get(launcher);
					if (storedListeners) {
						launcher.off("game:playing", storedListeners.onPlaying);
						launcher.off("game:stopped", storedListeners.onStopped);
						eventListeners.delete(launcher);
					}
				},
			};
			eventListeners.set(launcher, listeners);

			// Attach listeners
			launcher.on("game:playing", listeners.onPlaying);
			launcher.on("game:stopped", listeners.onStopped);

			try {
				await launcher.launch(input.args);
				logger.log("info", `Successfully launched game ${input.id}`);
				return {
					success: true,
					requiresPolling: launcher.getSessionInfo().requiresPolling,
				};
			} catch (error) {
				logger.log(
					"error",
					`Failed to launch game ${input.id}: ${(error as Error).message}`,
				);
				// Clean up listeners on launch failure
				const storedListeners = eventListeners.get(launcher);
				if (storedListeners) {
					launcher.off("game:playing", storedListeners.onPlaying);
					launcher.off("game:stopped", storedListeners.onStopped);
					eventListeners.delete(launcher);
				}
				return {
					success: false,
					error: `Launch failed: ${(error as Error).message}`,
				};
			}
		}),

	stop: publicProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ input }) => {
			const launcher = gamesLaunched.get(input.id);
			if (launcher) {
				try {
					await launcher.stop();
					logger.log("info", `Successfully stopped game ${input.id}`);
					return { success: true };
				} catch (error) {
					logger.log(
						"error",
						`Failed to stop game ${input.id}: ${(error as Error).message}`,
					);
					return {
						success: false,
						error: `Stop failed: ${(error as Error).message}`,
					};
				}
			}
			return { success: false, error: "Game not running" };
		}),

	isRunning: publicProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ input }) => {
			const launcher = gamesLaunched.get(input.id);
			if (!launcher) {
				return { running: false };
			}

			const isRunning = await launcher.isRunning();
			return { running: isRunning };
		}),

	getRunning: publicProcedure.query(async () => {
		const runningGames = [];

		for (const [_, launcher] of gamesLaunched.entries()) {
			const isRunning = await launcher.isRunning();
			if (isRunning) {
				runningGames.push(launcher.getSessionInfo());
			} else {
				launcher.stop();
			}
		}

		return runningGames;
	}),

	getSessionInfo: publicProcedure
		.input(z.object({ id: z.number() }))
		.query(({ input }) => {
			const launcher = gamesLaunched.get(input.id);
			if (!launcher) {
				return null;
			}
			return launcher.getSessionInfo();
		}),

	onGameStateChange: publicProcedure.subscription(async function* () {
		const cleanup = () => {
			emitter.removeAllListeners("game:playing");
			emitter.removeAllListeners("game:stopped");
			// Clean up any remaining launcher listeners
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
				// Wait for either playing or stopped event
				const result = await Promise.race([
					emitOnce<number>(emitter, "game:playing").then((id) => ({
						type: "playing" as const,
						id,
						timestamp: Date.now(),
					})),
					emitOnce<number>(emitter, "game:stopped").then((id) => ({
						type: "stopped" as const,
						id,
						timestamp: Date.now(),
					})),
				]);

				yield result;
			}
		} catch (error) {
			logger.log(
				"error",
				`Game state subscription error: ${(error as Error).message}`,
			);
			cleanup();
			throw error;
		} finally {
			cleanup();
		}
	}),
});

export type GameLauncherRouter = typeof gameLauncherRouter;
