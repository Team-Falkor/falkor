import { EventEmitter } from "node:events";
import { publicProcedure, router } from "@backend/api/trpc";
import { libraryGames } from "@backend/database/schemas";
import GameProcessLauncher, {
	LaunchError,
	LaunchOperationError,
} from "@backend/handlers/launcher/game-process-launcher";
import { gamesLaunched } from "@backend/handlers/launcher/games-launched";
import logger from "@backend/handlers/logging";
import { eq, type InferSelectModel } from "drizzle-orm";
import { z } from "zod";

/**
 * Enhanced global event emitter with better error handling
 */
const gameStateEmitter = new EventEmitter();

// Set max listeners to prevent warnings during development
gameStateEmitter.setMaxListeners(50);

// Add error handling for the emitter
gameStateEmitter.on("error", (error) => {
	logger.log("error", `Game state emitter error: ${error.message}`);
});

/**
 * Centralized event emission with error handling
 */
function emitGameEvent(eventType: "playing" | "stopped", gameId: number) {
	try {
		logger.log("debug", `Emitting ${eventType} event for game ${gameId}`);
		gameStateEmitter.emit(`game:${eventType}`, gameId);
	} catch (error) {
		logger.log(
			"error",
			`Failed to emit ${eventType} event for game ${gameId}: ${(error as Error).message}`,
		);
	}
}

/**
 * Enhanced launcher cleanup with better error handling
 */
async function cleanupLauncher(
	gameId: number,
	launcher: GameProcessLauncher,
	reason: string,
) {
	logger.log("info", `Cleaning up launcher for game ${gameId}: ${reason}`);

	try {
		// Remove all listeners first
		launcher.removeAllListeners();

		// Stop the launcher if it's still active
		if (await launcher.isRunning()) {
			logger.log("debug", `Stopping active launcher for game ${gameId}`);
			await launcher.stop();
		}

		// Remove from global tracking
		gamesLaunched.delete(gameId);

		logger.log("debug", `Successfully cleaned up launcher for game ${gameId}`);
	} catch (error) {
		logger.log(
			"error",
			`Error during cleanup for game ${gameId}: ${(error as Error).message}`,
		);
		// Force removal even if cleanup fails
		gamesLaunched.delete(gameId);
	}
}

/**
 * Safe launcher creation with proper event handling
 */
function createLauncher(
	game: InferSelectModel<typeof libraryGames>,
	args?: string[],
): GameProcessLauncher {
	if (!game.gamePath) {
		throw new Error("Game path is required");
	}
	const launcher = new GameProcessLauncher({
		id: game.id,
		gameId: game.gameId,
		gamePath: game.gamePath,
		gameName: game.gameName,
		gameIcon: game.gameIcon ?? undefined,
		steamId: game.gameSteamId ?? undefined,
		gameArgs: args,
		commandOverride: game.gameCommand ?? undefined,
		winePrefixPath: game.winePrefixFolder ?? undefined,
		runAsAdmin: game.runAsAdmin ?? false,
	});

	// Set up event listeners with proper error handling
	launcher.on("game:playing", (gameId: number) => {
		logger.log("info", `Game ${gameId} started playing`);
		emitGameEvent("playing", gameId);
	});

	launcher.on("game:stopped", (gameId: number) => {
		logger.log("info", `Game ${gameId} stopped`);
		emitGameEvent("stopped", gameId);

		// Clean up the launcher after a short delay to ensure all events are processed
		setTimeout(() => {
			cleanupLauncher(gameId, launcher, "Game stopped");
		}, 100);
	});

	// Add error handling for the launcher itself
	launcher.on("error", (error: Error) => {
		logger.log("error", `Launcher error for game ${game.id}: ${error.message}`);
	});

	return launcher;
}

/**
 * Validation schema
 */
const launchInputSchema = z.object({
	id: z.number(),
	args: z.array(z.string()).optional(),
});

export const gameLauncherRouter = router({
	/**
	 * Launch a game with enhanced error handling and cleanup
	 */
	launch: publicProcedure
		.input(launchInputSchema)
		.mutation(async ({ input, ctx }) => {
			try {
				// Get game data
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

				// Check for existing launcher
				const existingLauncher = gamesLaunched.get(input.id);
				if (existingLauncher) {
					try {
						const isCurrentlyRunning = await existingLauncher.isRunning();
						if (isCurrentlyRunning) {
							logger.log("warn", `Game ${input.id} is already running`);
							return { success: false, error: "Game is already running" };
						}

						// Clean up stale launcher
						logger.log(
							"info",
							`Cleaning up stale launcher for game ${input.id}`,
						);
						await cleanupLauncher(
							input.id,
							existingLauncher,
							"Stale launcher detected",
						);
					} catch (error) {
						logger.log(
							"error",
							`Error checking existing launcher: ${(error as Error).message}`,
						);
						// Force cleanup on error
						gamesLaunched.delete(input.id);
					}
				}

				// Create new launcher
				const launcher = createLauncher(game, input.args);

				try {
					// Launch the game
					await launcher.launch(input.args);

					// Add to global tracking only after successful launch
					gamesLaunched.set(input.id, launcher);

					logger.log(
						"info",
						`Successfully launched game ${input.id} (${game.gameName})`,
					);

					return {
						success: true,
						requiresPolling: launcher.getSessionInfo().requiresPolling,
					};
				} catch (error) {
					// Clean up on launch failure
					await cleanupLauncher(input.id, launcher, "Launch failed");

					// Handle specific error types
					let errorMessage = "Failed to launch game";
					if (error instanceof LaunchOperationError) {
						switch (error.errorType) {
							case LaunchError.EXECUTABLE_NOT_FOUND:
								errorMessage =
									"Game executable not found. Please check the path.";
								break;
							case LaunchError.INVALID_PATH:
								errorMessage = "The configured game path is invalid.";
								break;
							case LaunchError.PERMISSION_DENIED:
								errorMessage =
									"Permission denied. Cannot access the game executable.";
								break;
							case LaunchError.ALREADY_RUNNING:
								errorMessage = "The game is already running.";
								break;
							default:
								errorMessage = `Launch failed: ${error.message}`;
						}
					} else if (error instanceof Error) {
						errorMessage = error.message;
					}

					logger.log(
						"error",
						`Failed to launch game ${input.id}: ${errorMessage}`,
					);
					return { success: false, error: errorMessage };
				}
			} catch (error) {
				logger.log(
					"error",
					`Unexpected error in launch: ${(error as Error).message}`,
				);
				return { success: false, error: "An unexpected error occurred" };
			}
		}),

	/**
	 * Stop a running game
	 */
	stop: publicProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ input }) => {
			const launcher = gamesLaunched.get(input.id);
			if (!launcher) {
				logger.log("warn", `Attempted to stop non-running game ${input.id}`);
				return { success: false, error: "Game not running" };
			}

			try {
				await launcher.stop();
				logger.log("info", `Successfully stopped game ${input.id}`);
				return { success: true };
			} catch (error) {
				logger.log(
					"error",
					`Failed to stop game ${input.id}: ${(error as Error).message}`,
				);

				// Force cleanup even if stop fails
				await cleanupLauncher(input.id, launcher, "Force stop after error");

				return {
					success: false,
					error: `Stop failed: ${(error as Error).message}`,
				};
			}
		}),

	/**
	 * Check if a game is running (less aggressive cleanup)
	 */
	isRunning: publicProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ input }) => {
			const launcher = gamesLaunched.get(input.id);
			if (!launcher) {
				return { running: false };
			}

			try {
				const isCurrentlyRunning = await launcher.isRunning();

				// Only cleanup if we're absolutely sure the game is not running
				// and the launcher has been inactive for a while
				if (!isCurrentlyRunning) {
					const _sessionInfo = launcher.getSessionInfo();
					logger.log("debug", `Game ${input.id} appears to be not running`);

					// Give a grace period for processes that might be restarting
					setTimeout(async () => {
						// Double-check after grace period
						try {
							const stillRunning = await launcher.isRunning();
							if (!stillRunning) {
								logger.log(
									"info",
									`Confirmed game ${input.id} is not running, cleaning up`,
								);
								emitGameEvent("stopped", input.id);
								await cleanupLauncher(
									input.id,
									launcher,
									"Confirmed not running",
								);
							}
						} catch (error) {
							logger.log(
								"error",
								`Error in delayed cleanup check: ${(error as Error).message}`,
							);
						}
					}, 2000); // 2 second grace period
				}

				return { running: isCurrentlyRunning };
			} catch (error) {
				logger.log(
					"error",
					`Error checking if game ${input.id} is running: ${(error as Error).message}`,
				);
				return { running: false };
			}
		}),

	/**
	 * Get all running games with better error handling
	 */
	getRunning: publicProcedure.query(async () => {
		const runningGames = [];
		const gamesToCleanup: number[] = [];

		// Check all tracked games
		for (const [gameId, launcher] of gamesLaunched.entries()) {
			try {
				const isRunning = await launcher.isRunning();
				if (isRunning) {
					runningGames.push(launcher.getSessionInfo());
				} else {
					// Mark for cleanup but don't do it immediately
					gamesToCleanup.push(gameId);
				}
			} catch (error) {
				logger.log(
					"error",
					`Error checking game ${gameId} status: ${(error as Error).message}`,
				);
				gamesToCleanup.push(gameId);
			}
		}

		// Clean up non-running games after collecting all data
		if (gamesToCleanup.length > 0) {
			setTimeout(async () => {
				for (const gameId of gamesToCleanup) {
					const launcher = gamesLaunched.get(gameId);
					if (launcher) {
						try {
							// Final check before cleanup
							const stillRunning = await launcher.isRunning();
							if (!stillRunning) {
								emitGameEvent("stopped", gameId);
								await cleanupLauncher(
									gameId,
									launcher,
									"Cleanup from getRunning",
								);
							}
						} catch (error) {
							logger.log(
								"error",
								`Error in final cleanup check for game ${gameId}: ${(error as Error).message}`,
							);
							// Force cleanup on error
							await cleanupLauncher(
								gameId,
								launcher,
								"Force cleanup after error",
							);
						}
					}
				}
			}, 1000);
		}

		return runningGames;
	}),

	/**
	 * Get session information for a specific game
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
	 * Simplified and more reliable subscription
	 */
	onGameStateChange: publicProcedure.subscription(async function* ({ signal }) {
		const subscriptionId = Math.random().toString(36).substring(7);
		logger.log("debug", `Creating game state subscription ${subscriptionId}`);

		// Queue for events
		const eventQueue: Array<{
			type: "playing" | "stopped";
			id: number;
			timestamp: number;
		}> = [];

		let isActive = true;

		// Event handlers
		const onGameEvent = (type: "playing" | "stopped") => (id: number) => {
			if (!isActive) return;

			logger.log("debug", `Subscription ${subscriptionId}: Game ${id} ${type}`);
			eventQueue.push({
				type,
				id,
				timestamp: Date.now(),
			});
		};

		const onPlaying = onGameEvent("playing");
		const onStopped = onGameEvent("stopped");

		// Cleanup function
		const cleanup = () => {
			if (!isActive) return;
			isActive = false;

			logger.log("debug", `Cleaning up subscription ${subscriptionId}`);
			gameStateEmitter.removeListener("game:playing", onPlaying);
			gameStateEmitter.removeListener("game:stopped", onStopped);
		};

		// Handle client disconnect
		signal?.addEventListener("abort", cleanup);

		// Add listeners
		gameStateEmitter.on("game:playing", onPlaying);
		gameStateEmitter.on("game:stopped", onStopped);

		try {
			// Main subscription loop
			while (isActive && !signal?.aborted) {
				// Wait for events
				if (eventQueue.length === 0) {
					await new Promise((resolve) => {
						const timeout = setTimeout(resolve, 1000); // Check every second
						const checkEvent = () => {
							if (eventQueue.length > 0 || !isActive || signal?.aborted) {
								clearTimeout(timeout);
								resolve(undefined);
							}
						};

						const tempHandler = () => checkEvent();
						gameStateEmitter.once("game:playing", tempHandler);
						gameStateEmitter.once("game:stopped", tempHandler);

						// Cleanup temporary listeners after timeout
						setTimeout(() => {
							gameStateEmitter.removeListener("game:playing", tempHandler);
							gameStateEmitter.removeListener("game:stopped", tempHandler);
						}, 1100);
					});
				}

				// Yield all pending events
				while (eventQueue.length > 0 && isActive && !signal?.aborted) {
					const event = eventQueue.shift();
					if (event) {
						logger.log(
							"debug",
							`Subscription ${subscriptionId}: Yielding event, ${event.type}, ${event.id}`,
						);
						yield event;
					}
				}
			}
		} catch (error) {
			logger.log(
				"error",
				`Subscription ${subscriptionId} error: ${(error as Error).message}`,
			);
		} finally {
			cleanup();
		}
	}),
});

export type GameLauncherRouter = typeof gameLauncherRouter;
