import { EventEmitter } from "node:events";
import { publicProcedure, router } from "@backend/api/trpc";
import { libraryGames } from "@backend/database/schemas";
import GameProcessLauncher from "@backend/handlers/launcher/game-process-launcher";
import { gamesLaunched } from "@backend/handlers/launcher/games-launched";
import logger from "@backend/handlers/logging";
import { emitOnce } from "@backend/utils/emit-once";
import { eq } from "drizzle-orm";
import { z } from "zod";

/**
 * Global event emitter for game state changes.
 * Used for broadcasting `game:playing` and `game:stopped` events to subscribers.
 */
const emitter = new EventEmitter();

/**
 * Stores references to event listener functions for each GameProcessLauncher instance.
 * Using a WeakMap allows garbage collection of listeners when the launcher itself is no longer referenced.
 */
const eventListeners = new WeakMap<
	GameProcessLauncher,
	{ onPlaying: (id: number) => void; onStopped: (id: number) => void }
>();

/**
 * Zod schema for input validation when launching a game.
 */
const launchInputSchema = z.object({
	id: z.number(),
	args: z.array(z.string()).optional(),
});

/**
 * TRPC router for game launching and process management functionalities.
 * Provides mutations for launching/stopping games, queries for checking running status,
 * and a subscription for real-time game state changes.
 */
export const gameLauncherRouter = router({
	/**
	 * Mutation to launch a game.
	 *
	 * @param input - Contains the game's ID and optional command-line arguments.
	 * @returns An object indicating success and if polling is required, or an error.
	 */
	launch: publicProcedure
		.input(launchInputSchema)
		.mutation(async ({ input, ctx }) => {
			const game = await ctx.db
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

			// Check if the game is already known to be running or if there's a stale launcher instance.
			const existingLauncher = gamesLaunched.get(input.id);
			if (existingLauncher) {
				const isCurrentlyRunning = await existingLauncher.isRunning();
				if (isCurrentlyRunning) {
					logger.log(
						"warn",
						`Attempted to launch game ${input.id} which is already running.`,
					);
					return { success: false, error: "Game is already running" };
				}
				// If the launcher exists but the process isn't running, it's a stale entry. Clean it up.
				logger.log(
					"info",
					`Cleaning up stale launcher instance for game ${input.id}.`,
				);
				existingLauncher.stop();
				// Remove listeners associated with the stale launcher to prevent memory leaks.
				const staleListeners = eventListeners.get(existingLauncher);
				if (staleListeners) {
					existingLauncher.off("game:playing", staleListeners.onPlaying);
					existingLauncher.off("game:stopped", staleListeners.onStopped);
					eventListeners.delete(existingLauncher);
				}
				// Remove from global map after listeners are removed
				gamesLaunched.delete(input.id);
			}

			// Initialize a new GameProcessLauncher for the specified game.
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
			});

			// Define event listeners for this specific launcher instance.
			// These functions are bound to the launcher's lifecycle.
			const listeners = {
				onPlaying: (id: number) => {
					logger.log("info", `Game ${id} started playing`);
					// Emit a global event for all subscribers.
					emitter.emit("game:playing", id);
				},
				onStopped: (id: number) => {
					logger.log("info", `Game ${id} stopped`);
					// Emit a global event for all subscribers.
					emitter.emit("game:stopped", id);
					// Clean up the specific launcher's event listeners.
					const storedListeners = eventListeners.get(launcher);
					if (storedListeners) {
						launcher.off("game:playing", storedListeners.onPlaying);
						launcher.off("game:stopped", storedListeners.onStopped);
						// Remove the listeners from the WeakMap as they are no longer needed for this launcher.
						eventListeners.delete(launcher);
					}
					// Remove the launcher from the globally tracked map of launched games.
					gamesLaunched.delete(id);
				},
			};
			// Store the listener functions in the WeakMap, keyed by the launcher instance.
			eventListeners.set(launcher, listeners);

			// Attach the defined listeners to the launcher instance.
			launcher.on("game:playing", listeners.onPlaying);
			launcher.on("game:stopped", listeners.onStopped);

			try {
				// Attempt to launch the game.
				await launcher.launch(input.args);
				// Add the successfully launched game's launcher to the global map.
				gamesLaunched.set(input.id, launcher);
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
				// If launch fails, immediately clean up the attached listeners to prevent leaks.
				const storedListeners = eventListeners.get(launcher);
				if (storedListeners) {
					launcher.off("game:playing", storedListeners.onPlaying);
					launcher.off("game:stopped", storedListeners.onStopped);
					eventListeners.delete(launcher);
				}
				// No need to delete from gamesLaunched as it was never successfully added.
				return {
					success: false,
					error: `Launch failed: ${(error as Error).message}`,
				};
			}
		}),

	/**
	 * Mutation to stop a running game.
	 *
	 * @param input - Contains the ID of the game to stop.
	 * @returns An object indicating success or failure to stop the game.
	 */
	stop: publicProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ input }) => {
			const launcher = gamesLaunched.get(input.id);
			if (launcher) {
				try {
					await launcher.stop();
					// The 'game:stopped' event handler will perform further cleanup.
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
			logger.log(
				"warn",
				`Attempted to stop game ${input.id} which is not running.`,
			);
			return { success: false, error: "Game not running" };
		}),

	/**
	 * Query to check if a specific game is currently running.
	 *
	 * @param input - Contains the ID of the game to check.
	 * @returns An object with a `running` boolean.
	 */
	isRunning: publicProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ input }) => {
			const launcher = gamesLaunched.get(input.id);
			if (!launcher) {
				return { running: false };
			}

			const isCurrentlyRunning = await launcher.isRunning();
			// If the launcher is present but the game is not running, clean up its entry.
			if (!isCurrentlyRunning) {
				logger.log(
					"info",
					`Game ${input.id} detected as not running; cleaning up launcher.`,
				);
				// Emit stopped event to notify subscribers before cleanup
				emitter.emit("game:stopped", input.id);
				launcher.stop(); // Ensures any internal resources are released.
				const storedListeners = eventListeners.get(launcher);
				if (storedListeners) {
					launcher.off("game:playing", storedListeners.onPlaying);
					launcher.off("game:stopped", storedListeners.onStopped);
					eventListeners.delete(launcher);
				}
				gamesLaunched.delete(input.id);
			}
			return { running: isCurrentlyRunning };
		}),

	/**
	 * Query to get a list of all currently running games.
	 * Also cleans up stale launcher entries.
	 *
	 * @returns An array of session information for all active games.
	 */
	getRunning: publicProcedure.query(async () => {
		const runningGames = [];

		// Iterate through all known launched games and verify their running status.
		for (const [gameId, launcher] of gamesLaunched.entries()) {
			const isRunning = await launcher.isRunning();
			if (isRunning) {
				runningGames.push(launcher.getSessionInfo());
			} else {
				// If a launcher exists but the game is not running, it's stale. Clean up.
				logger.log(
					"info",
					`Game ${gameId} detected as not running during getRunning; cleaning up.`,
				);
				// Emit stopped event to notify subscribers before cleanup
				emitter.emit("game:stopped", gameId);
				launcher.stop(); // Ensures any internal resources are released.
				const storedListeners = eventListeners.get(launcher);
				if (storedListeners) {
					launcher.off("game:playing", storedListeners.onPlaying);
					launcher.off("game:stopped", storedListeners.onStopped);
					eventListeners.delete(launcher);
				}
				gamesLaunched.delete(gameId);
			}
		}

		return runningGames;
	}),

	/**
	 * Query to get session information for a specific game.
	 *
	 * @param input - Contains the ID of the game.
	 * @returns The session information for the game, or `null` if not found.
	 */
	getSessionInfo: publicProcedure
		.input(z.object({ id: z.number() }))
		.query(({ input }) => {
			const launcher = gamesLaunched.get(input.id);
			if (!launcher) {
				return null;
			}
			return launcher.getSessionInfo();
		}),

	/**
	 * Subscription for real-time updates on game state changes (playing/stopped).
	 * Clients can subscribe to this endpoint to receive notifications whenever a game starts or stops.
	 * Ensures proper cleanup of listeners when a subscription ends.
	 */
	onGameStateChange: publicProcedure.subscription(async function* () {
		// Create unique listeners for this specific subscription to avoid conflicts
		const subscriptionId = Math.random().toString(36).substring(7);

		// Define subscription-specific event handlers
		const onPlayingHandler = (_id: number) => {
			// This will be handled by the subscription loop
		};

		const onStoppedHandler = (_id: number) => {
			// This will be handled by the subscription loop
		};

		// Cleanup function that only removes this subscription's listeners
		const cleanup = () => {
			logger.log(
				"debug",
				`Cleaning up game state change subscription ${subscriptionId}.`,
			);
			// Remove only this subscription's listeners, not all listeners
			emitter.off("game:playing", onPlayingHandler);
			emitter.off("game:stopped", onStoppedHandler);
		};

		// Add listeners for this subscription
		emitter.on("game:playing", onPlayingHandler);
		emitter.on("game:stopped", onStoppedHandler);

		try {
			while (true) {
				// Waits for either a 'game:playing' or 'game:stopped' event to be emitted.
				// `emitOnce` is crucial here to only capture the next single event.
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

				yield result; // Yield the event data to the subscriber.
			}
		} catch (error) {
			logger.log(
				"error",
				`Game state subscription error: ${(error as Error).message}`,
			);
			// Ensure cleanup is called even if an error occurs.
			cleanup();
			throw error; // Re-throw to propagate the error through the subscription.
		} finally {
			// `finally` block ensures cleanup always runs when the subscription terminates,
			// whether due to completion, error, or client disconnection.
			cleanup();
		}
	}),
});

/**
 * Defines the type of the `gameLauncherRouter` for client-side type inference.
 */
export type GameLauncherRouter = typeof gameLauncherRouter;
