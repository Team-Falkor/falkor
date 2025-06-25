import type { ChildProcess } from "node:child_process";
import EventEmitter from "node:events";
import fs from "node:fs";
import path from "node:path";

import { db } from "@backend/database";
import { libraryGames } from "@backend/database/schemas";
import logger from "@backend/handlers/logging";
import {
	findProcessByName,
	safeSpawn,
	waitForProcessToStart,
} from "@backend/utils/process-spawning";
import { eq } from "drizzle-orm";
import ms from "ms";
import { AchievementItem } from "../achievements/item";
import { gamesLaunched } from "./games-launched";
import { resolveExecutablePath } from "./utils/process-utils";

interface TrackedProcessInfo {
	pid: number | null;
	name: string;
	requiresPolling: boolean;
	pollingFailureCount: number;
	maxPollingFailures: number;
}

interface LauncherOptions {
	gamePath: string;
	id: number;
	gameId: string;
	steamId?: string;
	gameName: string;
	gameIcon?: string;
	gameArgs?: string[];
	commandOverride?: string;
	winePrefixPath?: string;
	runAsAdmin?: boolean;
}

export default class GameProcessLauncher extends EventEmitter {
	private readonly id: number;
	private readonly gamePath: string;
	private readonly commandOverride?: string;
	private readonly achievementItem?: AchievementItem;
	private readonly runAsAdmin: boolean;
	private readonly gameName: string;

	private process: ChildProcess | null = null;
	private trackedProcessInfo: TrackedProcessInfo | null = null;

	private startTime = 0;
	private totalPlaytimeMs = 0;
	private intervalId: NodeJS.Timeout | null = null;
	private isActive = false;
	private processCheckIntervalId: NodeJS.Timeout | null = null;
	private adminLaunchDetectionTimeout: NodeJS.Timeout | null = null;

	constructor(opts: LauncherOptions) {
		super();
		const resolvedPath = resolveExecutablePath(opts.gamePath);
		if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) {
			throw new Error(`Invalid executable: ${opts.gamePath}`);
		}

		this.id = opts.id;
		this.gamePath = resolvedPath;
		this.commandOverride = opts.commandOverride;
		this.runAsAdmin = opts.runAsAdmin ?? false;
		this.gameName = opts.gameName;

		if (opts.steamId) {
			this.achievementItem = new AchievementItem({
				game_id: opts.gameId,
				steam_id: opts.steamId,
				game_name: opts.gameName,
				game_icon: opts.gameIcon,
				wine_prefix_folder: opts.winePrefixPath,
			});
		}
	}

	public async launch(args: string[] = []): Promise<void> {
		if (this.isActive) {
			logger.log("warn", `Game ${this.id} is already running.`);
			return;
		}

		const executable = this.commandOverride || this.gamePath;
		const spawnArgs = this.commandOverride ? [this.gamePath, ...args] : args;

		try {
			const spawnResult = safeSpawn(executable, spawnArgs, {
				cwd: path.dirname(this.gamePath),
				runAsAdmin: this.runAsAdmin,
				stdio: this.runAsAdmin ? "inherit" : "pipe",
			});

			this.process = spawnResult.process;
			this.trackedProcessInfo = {
				pid: spawnResult.process?.pid ?? null,
				name: spawnResult.processName,
				requiresPolling: spawnResult.requiresPolling,
				pollingFailureCount: 0,
				maxPollingFailures: 10, // Stop polling after 10 consecutive failures
			};

			if (this.process) {
				this.process.unref();
				this.process.once("exit", (code, signal) =>
					this.handleExit(code, signal),
				);
				this.process.once("error", (err) =>
					logger.log(
						"error",
						`Error with directly spawned process (PID: ${this.process?.pid || "N/A"}): ${err.message}`,
					),
				);

				logger.log(
					"info",
					`Launched ${this.gameName} (ID: ${this.id}) with direct control (PID: ${this.trackedProcessInfo?.pid || "unknown"}).`,
				);
			} else {
				logger.log(
					"info",
					`Launched ${this.gameName} (ID: ${this.id}) via admin elevation. Attempting to detect process...`,
				);

				// Start tracking and achievements immediately for admin launches
				// We'll detect the process in the background
				this.startTracking();
				if (this.achievementItem) this.achievementItem.find();

				// Try to detect the process with a timeout
				this.adminLaunchDetectionTimeout = setTimeout(async () => {
					const detectedPid = await waitForProcessToStart(
						spawnResult.processName,
						500, // 500ms intervals
						20, // 10 seconds max
					);

					if (detectedPid && this.trackedProcessInfo) {
						this.trackedProcessInfo.pid = detectedPid;
						logger.log(
							"info",
							`Game process detected with PID: ${detectedPid}`,
						);
					} else {
						logger.log(
							"warn",
							`Could not detect game process for '${this.gameName}' after admin launch. Will continue with name-based polling.`,
						);
					}
					this.adminLaunchDetectionTimeout = null;
				}, 500); // Small delay to let the process start
			}

			// For non-admin launches, start tracking normally
			if (!this.runAsAdmin) {
				this.startTracking();
				if (this.achievementItem) this.achievementItem.find();
			}
			this.startProcessPolling();

			gamesLaunched.set(this.id, this);
		} catch (err) {
			logger.log(
				"error",
				`Failed to launch ${this.gameName} (ID: ${this.id}): ${(err as Error).message}`,
			);
			this.cleanupResources();
			throw err;
		}
	}

	private startTracking(): void {
		this.startTime = Date.now();
		this.isActive = true;
		this.emit("game:playing", this.id);

		this.intervalId = setInterval(() => this.updateSessionTime(), ms("1m"));
		logger.log(
			"info",
			`Started tracking session for ${this.id} (${this.gameName}).`,
		);
	}

	private updateSessionTime(): void {
		if (!this.isActive) return;
		const now = Date.now();
		const delta = now - this.startTime;
		this.startTime = now;
		this.totalPlaytimeMs += delta;
		logger.log(
			"debug",
			`Session +${ms(delta)}; total ${ms(this.totalPlaytimeMs)} for ${this.gameName}.`,
		);
	}

	private startProcessPolling(): void {
		if (this.processCheckIntervalId) {
			clearTimeout(this.processCheckIntervalId);
			this.processCheckIntervalId = null;
		}

		logger.log(
			"info",
			`Starting continuous polling for ${this.gameName} process.`,
		);

		// Start the adaptive polling cycle
		this.scheduleNextPoll();
	}

	/**
	 * Schedules the next polling check with adaptive interval
	 */
	private scheduleNextPoll(): void {
		if (!this.isActive) {
			return;
		}

		const interval = this.getAdaptivePollingInterval();
		this.processCheckIntervalId = setTimeout(async () => {
			this.processCheckIntervalId = null;

			// Early exit check to prevent race conditions
			if (!this.isActive) {
				logger.log(
					"debug",
					`Polling for ${this.gameName} stopped because game is no longer active.`,
				);
				return;
			}

			// Check if we've exceeded max polling failures
			if (
				this?.trackedProcessInfo &&
				this?.trackedProcessInfo?.pollingFailureCount >=
					this?.trackedProcessInfo?.maxPollingFailures
			) {
				logger.log(
					"warn",
					`Stopping polling for ${this.gameName} after ${this.trackedProcessInfo.pollingFailureCount} consecutive failures.`,
				);
				this.handleExit(0, null);
				return;
			}

			const failureCount = this.trackedProcessInfo?.pollingFailureCount || 0;
			const logLevel = failureCount > 3 ? "debug" : "debug"; // Reduce log verbosity for repeated failures

			logger.log(
				logLevel,
				`Polling for ${this.gameName} process: checking if still running... (failures: ${failureCount})`,
			);

			try {
				const isRunning = await this.isGameProcessRunning();

				// Double-check if still active after async operation
				if (!this.isActive) {
					logger.log(
						"debug",
						`Polling for ${this.gameName} stopped during process check - game no longer active.`,
					);
					return;
				}

				if (!isRunning) {
					logger.log(
						"info",
						`Detected ${this.gameName} process has exited via polling.`,
					);
					this.handleExit(0, null);
					return;
				}

				// Schedule next poll if process is still running
				this.scheduleNextPoll();
			} catch (error) {
				logger.log(
					"warn",
					`Error during process polling for ${this.gameName}: ${(error as Error).message}`,
				);
				// Schedule next poll even on error
				this.scheduleNextPoll();
			}
		}, interval);
	}

	/**
	 * Gets an adaptive polling interval that increases based on consecutive failures
	 * to reduce excessive logging when a process is not found.
	 */
	private getAdaptivePollingInterval(): number {
		if (!this.trackedProcessInfo) {
			return ms("3s"); // Default interval
		}

		const failureCount = this.trackedProcessInfo.pollingFailureCount;

		// Adaptive intervals based on failure count
		if (failureCount === 0) {
			return ms("3s"); // Normal polling when process is found
		}
		if (failureCount <= 2) {
			return ms("5s"); // Slightly slower after first failures
		}
		if (failureCount <= 5) {
			return ms("10s"); // Slower polling for persistent failures
		}
		return ms("15s"); // Much slower for extended failures
	}

	private async isGameProcessRunning(): Promise<boolean> {
		// Early exit if game is no longer active
		if (!this.isActive) {
			logger.log(
				"debug",
				"isGameProcessRunning: Game is no longer active. Returning false.",
			);
			return false;
		}

		if (!this.trackedProcessInfo) {
			logger.log(
				"debug",
				"isGameProcessRunning: No tracked process information available. Returning false.",
			);
			return false;
		}

		if (this.process) {
			logger.log(
				"debug",
				`isGameProcessRunning: Using direct ChildProcess handle for ${this.gameName} (PID: ${this.process.pid}).`,
			);
			// Reset failure count for direct process handles
			if (this.trackedProcessInfo) {
				this.trackedProcessInfo.pollingFailureCount = 0;
			}
			return true;
		}

		const processName = this.trackedProcessInfo.name;
		const processPid = this.trackedProcessInfo.pid;

		logger.log(
			"debug",
			`isGameProcessRunning: Using polling logic for '${processName}'${processPid ? ` (PID: ${processPid})` : ""}.`,
		);

		try {
				if (processPid) {
					// Reduce verbosity for repeated failures to minimize excessive logging
					const verbose = (this.trackedProcessInfo?.pollingFailureCount || 0) <= 3;
					const pids = await findProcessByName(processName, verbose);

				// Check if still active after async operation
				if (!this.isActive) {
					logger.log(
						"debug",
						"isGameProcessRunning: Game became inactive during process lookup. Returning false.",
					);
					return false;
				}

				if (pids.includes(processPid)) {
					logger.log(
						"debug",
						`isGameProcessRunning: Process '${processName}' found with PID ${processPid}.`,
					);
					// Reset failure count on successful detection
					this.trackedProcessInfo.pollingFailureCount = 0;
					return true;
				}
				logger.log(
					"debug",
					`isGameProcessRunning: PID ${processPid} not found among running '${processName}' processes. Current PIDs: [${pids.join(", ")}]`,
				);
			} else {
					// Reduce verbosity for repeated failures to minimize excessive logging
					const verbose = (this.trackedProcessInfo?.pollingFailureCount || 0) <= 3;
					const pids = await findProcessByName(processName, verbose);

				// Check if still active after async operation
				if (!this.isActive) {
					logger.log(
						"debug",
						"isGameProcessRunning: Game became inactive during process lookup. Returning false.",
					);
					return false;
				}

				if (pids.length > 0) {
					this.trackedProcessInfo.pid = pids[0];
					logger.log(
						"debug",
						`isGameProcessRunning: Process '${processName}' found by name. Updated tracked PID to: ${pids[0]}.`,
					);
					// Reset failure count on successful detection
					this.trackedProcessInfo.pollingFailureCount = 0;
					return true;
				}

				logger.log(
					"debug",
					`isGameProcessRunning: Process '${processName}' not found by name.`,
				);
			}
		} catch (error) {
			logger.log(
				"warn",
				`isGameProcessRunning: Error checking status for '${processName}': ${(error as Error).message}`,
			);
			// Don't increment failure count for errors, only for process not found
			return false;
		}

		// Increment failure count when process is not found (but only if still active)
		if (this.trackedProcessInfo && this.isActive) {
			this.trackedProcessInfo.pollingFailureCount++;
			logger.log(
				"debug",
				`isGameProcessRunning: Process not found. Failure count: ${this.trackedProcessInfo.pollingFailureCount}/${this.trackedProcessInfo.maxPollingFailures}`,
			);
		}

		return false;
	}

	private async handleExit(
		code: number | null,
		signal: NodeJS.Signals | null,
	): Promise<void> {
		logger.log(
			"info",
			`handleExit: Process exited: code=${code} signal=${signal}`,
		);
		if (!this.isActive) {
			logger.log("debug", "handleExit called but game not active. Skipping.");
			return;
		}

		// Immediately set inactive to prevent race conditions
		this.isActive = false;

		// Clear admin launch detection timeout if it exists
		if (this.adminLaunchDetectionTimeout) {
			clearTimeout(this.adminLaunchDetectionTimeout);
			this.adminLaunchDetectionTimeout = null;
			logger.log(
				"debug",
				"handleExit: Cleared admin launch detection timeout.",
			);
		}

		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
			logger.log("debug", "handleExit: Cleared playtime tracking interval.");
		}
		if (this.processCheckIntervalId) {
			clearTimeout(this.processCheckIntervalId);
			this.processCheckIntervalId = null;
			logger.log("debug", "handleExit: Cleared process polling timeout.");
		}

		await this.commitPlaytime();
		this.cleanupResources();
		this.emit("game:stopped", this.id);
	}

	private async commitPlaytime(): Promise<void> {
		try {
			const game = await this.findGameById(this.id);
			const newPlaytime = (game.gamePlaytime ?? 0) + this.totalPlaytimeMs;

			await db
				.update(libraryGames)
				.set({
					gamePlaytime: newPlaytime,
					gameLastPlayed: new Date(),
				})
				.where(eq(libraryGames.id, this.id));

			logger.log(
				"info",
				`commitPlaytime: Playtime saved for ${this.gameName}: ${ms(newPlaytime)} (session: ${ms(this.totalPlaytimeMs)}).`,
			);
		} catch (err) {
			logger.log(
				"error",
				`commitPlaytime: Failed to save playtime for ${this.gameName}: ${(err as Error).message}`,
			);
		}
	}

	private async findGameById(id: number) {
		const game = await db
			.select()
			.from(libraryGames)
			.where(eq(libraryGames.id, id))
			.get();

		if (!game) {
			throw new Error(`Game not found: ${id}`);
		}

		return game;
	}

	private cleanupResources(): void {
		// Clear all intervals and timeouts
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
			logger.log(
				"debug",
				"cleanupResources: Cleared playtime tracking interval.",
			);
		}

		if (this.processCheckIntervalId) {
			clearInterval(this.processCheckIntervalId);
			this.processCheckIntervalId = null;
			logger.log(
				"debug",
				"cleanupResources: Cleared process polling interval.",
			);
		}

		if (this.adminLaunchDetectionTimeout) {
			clearTimeout(this.adminLaunchDetectionTimeout);
			this.adminLaunchDetectionTimeout = null;
			logger.log(
				"debug",
				"cleanupResources: Cleared admin launch detection timeout.",
			);
		}

		// Terminate process if still running
		if (this.process && !this.process.killed) {
			try {
				logger.log(
					"info",
					`cleanupResources: Attempting to terminate directly spawned process ${this.process.pid} for ${this.gameName}.`,
				);
				this.process.kill("SIGTERM");
			} catch (error) {
				logger.log(
					"warn",
					`cleanupResources: Failed to terminate process ${this.process.pid}: ${(error as Error).message}`,
				);
			}
		}

		// Clear references
		this.process = null;
		this.trackedProcessInfo = null;

		// Destroy achievement watcher
		if (this.achievementItem?.watcher_instance) {
			try {
				this.achievementItem.watcher_instance.destroy();
				logger.log(
					"debug",
					`cleanupResources: Destroyed achievement watcher for ${this.gameName}.`,
				);
			} catch (error) {
				logger.log(
					"warn",
					`cleanupResources: Failed to destroy achievement watcher: ${(error as Error).message}`,
				);
			}
		}

		// Remove from global tracking
		gamesLaunched.delete(this.id);
		logger.log(
			"info",
			`cleanupResources: Cleaned up resources for ${this.id}.`,
		);
	}

	public async stop(): Promise<void> {
		logger.log(
			"info",
			`stop: Attempting to stop game ${this.id} (${this.gameName}).`,
		);
		if (!this.isActive) {
			logger.log(
				"debug",
				`stop: Game ${this.id} (${this.gameName}) is not active, no need to stop.`,
			);
			return;
		}

		if (this.process) {
			logger.log(
				"debug",
				`stop: Killing directly spawned process ${this.process.pid} for ${this.gameName}.`,
			);
			this.process.kill("SIGTERM");
		} else if (this.trackedProcessInfo?.pid) {
			const pid = this.trackedProcessInfo.pid;
			try {
				logger.log(
					"debug",
					`stop: Attempting to kill tracked PID ${pid} for ${this.gameName} via process.kill.`,
				);
				process.kill(pid, "SIGTERM");
				logger.log("info", `stop: Sent SIGTERM to PID ${pid}`);
			} catch (err) {
				logger.log(
					"warn",
					`stop: Could not kill process ${pid} for ${this.gameName}: ${(err as Error).message}. Forcing stop tracking.`,
				);
				this.handleExit(0, null);
			}
		} else {
			logger.log(
				"warn",
				`stop: Cannot directly kill elevated game ${this.id} as PID is unknown and no direct handle. Stopping tracking.`,
			);
			this.handleExit(0, null);
		}
	}

	public async isRunning(): Promise<boolean> {
		if (!this.isActive) {
			logger.log(
				"debug",
				`isRunning: Game ${this.id} is not active. Returning false.`,
			);
			return false;
		}
		if (!this.trackedProcessInfo) {
			logger.log(
				"debug",
				`isRunning: Game ${this.id} has no tracked info. Returning false.`,
			);
			return false;
		}

		const result = await this.isGameProcessRunning();
		logger.log(
			"debug",
			`isRunning: Check complete for ${this.gameName}. Result: ${result}.`,
		);
		return result;
	}

	public getSessionInfo() {
		return {
			id: this.id,
			gameName: this.gameName,
			isActive: this.isActive,
			sessionPlaytime: this.totalPlaytimeMs,
			pid: this.trackedProcessInfo?.pid ?? null,
			requiresPolling: this.trackedProcessInfo?.requiresPolling ?? false,
		};
	}
}
