import { EventEmitter } from "node:events";
import { publicProcedure, router } from "@backend/api/trpc";
import { libraryGames } from "@backend/database/schemas";
import GameProcessLauncher from "@backend/handlers/launcher/game-process-launcher";
import { gamesLaunched } from "@backend/handlers/launcher/games-launched";
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

			const launcher = new GameProcessLauncher({
				id: game.id,
				gamePath: game.gamePath,
				gameName: game.gameName,
				gameIcon: game.gameIcon ?? undefined,
				steamId: game.gameSteamId ?? undefined,
				gameArgs: input.args,
				commandOverride: game.gameCommand ?? undefined,
				winePrefixPath: game.winePrefixFolder ?? undefined,
				runAsAdmin: game.runAsAdmin,
			});

			// Create and store event listeners
			const listeners = {
				onPlaying: (id: number) => emitter.emit("game:playing", id),
				onStopped: (id: number) => emitter.emit("game:stopped", id),
			};
			eventListeners.set(launcher, listeners);

			// Attach listeners
			launcher.on("game:playing", listeners.onPlaying);
			launcher.on("game:stopped", listeners.onStopped);

			try {
				launcher.launch(input.args);
				return { success: true };
			} catch (error) {
				// Clean up listeners on launch failure
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
		.input(z.object({ id: z.number() }))
		.mutation(({ input }) => {
			const launcher = gamesLaunched.get(input.id);
			if (launcher) {
				launcher.stop();
				return { success: true };
			}
			return { success: false, error: "Game not running" };
		}),

	isRunning: publicProcedure
		.input(z.object({ id: z.number() }))
		.query(({ input }) => {
			return { running: gamesLaunched.has(input.id) };
		}),

	getRunning: publicProcedure.query(() => {
		return Array.from(gamesLaunched.keys());
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
					})),
					emitOnce<number>(emitter, "game:stopped").then((id) => ({
						type: "stopped" as const,
						id,
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
