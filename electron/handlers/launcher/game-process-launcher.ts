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
	name: string; // The base name of the process (e.g., "MyGame")
	requiresPolling: boolean; // True if launched via admin/detached and direct process handle is not available
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

	private process: ChildProcess | null = null; // The direct ChildProcess object if spawned non-admin
	private trackedProcessInfo: TrackedProcessInfo | null = null; // Info for tracking, esp. for polling
	private readonly MAX_RETRIES = 5;
	private readonly RETRY_DELAY_MS = 2500;
	private readonly INITIAL_PROCESS_CHECK_DELAY_MS = 5000; // 5 seconds

	private startTime = 0;
	private totalPlaytimeMs = 0;
	private intervalId: NodeJS.Timeout | null = null;
	private isActive = false;
	private processCheckIntervalId: NodeJS.Timeout | null = null;

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
				// Inherit stdio for admin processes to see prompts, otherwise pipe for non-admin
				stdio: this.runAsAdmin ? "inherit" : "pipe",
			});

			this.process = spawnResult.process; // This will be null if runAsAdmin
			this.trackedProcessInfo = {
				pid: spawnResult.process?.pid ?? null,
				name: spawnResult.processName,
				requiresPolling: spawnResult.requiresPolling,
			};

			if (this.process) {
				// We have direct control over the process (non-admin launch)
				this.process.unref(); // Allows the parent process to exit independently
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
					`Launched ${this.gameName} (ID: ${this.id}) with direct control (PID: ${this.trackedProcessInfo.pid}).`,
				);
				// No polling needed here, exit event will notify us
			} else {
				// Launched via admin elevation (no direct ChildProcess handle)
				logger.log(
					"info",
					`Launched ${this.gameName} (ID: ${this.id}) via admin elevation. Applying initial delay before process check...`,
				);

				// Introduce initial delay
				await new Promise((resolve) =>
					setTimeout(resolve, this.INITIAL_PROCESS_CHECK_DELAY_MS),
				);
				logger.log(
					"debug",
					`Initial ${ms(this.INITIAL_PROCESS_CHECK_DELAY_MS)} delay complete. Now attempting to detect process for '${this.gameName}'...`,
				);

				// Use waitForProcessToStart to find the PID
				const detectedPid = await waitForProcessToStart(
					spawnResult.processName,
					15000, // Timeout for waitForProcessToStart
				);

				if (detectedPid) {
					this.trackedProcessInfo.pid = detectedPid;
					logger.log("info", `Game process detected with PID: ${detectedPid}`);
					this.startProcessPolling(); // Start polling once PID is detected
				} else {
					logger.log(
						"warn",
						`Could not detect game process for '${this.gameName}' after initial wait and waitForProcessToStart. Will start name-based polling immediately.`,
					);
					// If initial detection failed, we still want to poll, but this might be less reliable.
					this.startProcessPolling();
				}
			}

			this.startTracking();
			if (this.achievementItem) this.achievementItem.find();

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
		// Clear any existing interval to prevent duplicates
		if (this.processCheckIntervalId) {
			clearInterval(this.processCheckIntervalId);
			this.processCheckIntervalId = null;
		}

		logger.log(
			"info",
			`Starting continuous polling for ${this.gameName} process.`,
		);

		this.processCheckIntervalId = setInterval(async () => {
			if (!this.isActive) {
				// If game is no longer active, stop polling
				if (this.processCheckIntervalId) {
					clearInterval(this.processCheckIntervalId);
					this.processCheckIntervalId = null;
				}
				logger.log(
					"debug",
					`Polling for ${this.gameName} stopped because game is no longer active.`,
				);
				return;
			}

			logger.log(
				"debug",
				`Polling for ${this.gameName} process: checking if still running...`,
			);

			const isRunning = await this.isGameProcessRunning(); // This method now handles the logic
			if (!isRunning) {
				logger.log(
					"info",
					`Detected ${this.gameName} process has exited via polling.`,
				);
				this.handleExit(0, null); // Call handleExit if process is no longer found
			}
		}, ms("3s")); // Check every 3 seconds for better responsiveness
	}

	/**
	 * Determines if the game process is running.
	 * If a direct ChildProcess handle is available, it checks that.
	 * Otherwise, it uses `findProcessByName` with retry logic.
	 *
	 * @returns {Promise<boolean>} True if the process is found, false otherwise.
	 */
	private async isGameProcessRunning(): Promise<boolean> {
		if (!this.trackedProcessInfo) {
			logger.log(
				"debug",
				"isGameProcessRunning: No tracked process information available. Returning false.",
			);
			return false;
		}

		// 1. If we have a direct ChildProcess handle AND it hasn't exited, use that.
		// This applies to non-admin launches where `this.process` is not null.
		if (this.process) {
			// Check if the process property is still valid and has a PID
			// On Windows, child.pid is invalid after process exits, but on Unix-like, it remains
			// A reliable way is to check the 'exit' status or if it's explicitly null/undefined.
			// However, since we register 'exit' event to call handleExit, if isActive is true
			// and process is not null, it's presumed to be running until 'exit' fires.
			// More robust check: process.kill(pid, 0) can check if a process exists without killing it
			// However, `process.killed` property or checking if the process object is still there
			// implies it hasn't completely resolved its exit state, which is generally reliable with Node's ChildProcess.
			// The main check for `this.process` being non-null and `this.isActive` ensures it.
			logger.log(
				"debug",
				`isGameProcessRunning: Using direct ChildProcess handle for ${this.gameName} (PID: ${this.process.pid}).`,
			);
			try {
				// A gentle poke to see if it's still alive (only effective on Unix-like for existence check without killing)
				// On Windows, this will throw if PID is invalid, but is not a direct way to check process *state*.
				// Node.js's child.exit and child.killed are generally the best indicators for directly spawned processes.
				// If the 'exit' event has already fired, `handleExit` would have set `isActive` to false.
				// So, if `this.isActive` is true AND `this.process` is present, we assume it's running.
				// This is the most efficient and reliable check for directly spawned processes.
				if (this.process.pid && process.platform !== "win32") {
					// Check if PID exists and not on windows for process.kill(pid, 0)
					process.kill(this.process.pid, 0); // Check if process exists without sending signal
				}
				// If no error, process is presumed running or hasn't fully exited yet from Node's perspective.
				return true;
			} catch (e) {
				// If process.kill(pid, 0) throws (e.g., process not found), it's definitely dead
				logger.log(
					"debug",
					`isGameProcessRunning: Direct process ${this.gameName} (PID: ${this.process.pid}) check failed: ${(e as Error).message}. Presuming dead.`,
				);
				return false; // Process is likely dead, let handleExit cleanup
			}
		}

		// 2. If no direct ChildProcess handle (requiresPolling is true), use findProcessByName with retries.
		const processName = this.trackedProcessInfo.name;
		const processPid = this.trackedProcessInfo.pid;

		logger.log(
			"debug",
			`isGameProcessRunning: Using polling logic for '${processName}'${processPid ? ` (PID: ${processPid})` : ""}.`,
		);

		for (let i = 0; i < this.MAX_RETRIES; i++) {
			logger.log(
				"debug",
				`isGameProcessRunning: Polling attempt ${i + 1}/${this.MAX_RETRIES}.`,
			);

			try {
				if (processPid) {
					// If we have a detected PID, try to find it specifically.
					const pids = await findProcessByName(processName);
					if (pids.includes(processPid)) {
						logger.log(
							"debug",
							`isGameProcessRunning: Process '${processName}' found with PID ${processPid}.`,
						);
						return true;
					}
					logger.log(
						"debug",
						`isGameProcessRunning: PID ${processPid} not found among running '${processName}' processes. Current PIDs: [${pids.join(", ")}]`,
					);
				} else {
					// If PID is null (e.g., first check after admin launch failed to get PID), just check by name.
					const pids = await findProcessByName(processName);
					if (pids.length > 0) {
						// If found by name, update the tracked PID for future checks (optimization).
						this.trackedProcessInfo.pid = pids[0];
						logger.log(
							"debug",
							`isGameProcessRunning: Process '${processName}' found by name. Updated tracked PID to: ${pids[0]}.`,
						);
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
					`isGameProcessRunning: Polling attempt ${i + 1}/${this.MAX_RETRIES}: Error checking status for '${processName}': ${(error as Error).message}`,
				);
			}

			// If process not found, and it's not the last attempt, wait before retrying
			if (i < this.MAX_RETRIES - 1) {
				logger.log(
					"debug",
					`isGameProcessRunning: Polling process not found. Retrying in ${this.RETRY_DELAY_MS}ms...`,
				);
				await new Promise((resolve) =>
					setTimeout(resolve, this.RETRY_DELAY_MS),
				);
			}
		}

		// If loop completes, process was not found after all polling retries
		logger.log(
			"error",
			`isGameProcessRunning: Failed to confirm game process '${processName}'${processPid ? ` (PID: ${processPid})` : ""} running after ${this.MAX_RETRIES} polling attempts.`,
		);
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

		this.isActive = false;
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
			logger.log("debug", "handleExit: Cleared playtime tracking interval.");
		}
		if (this.processCheckIntervalId) {
			clearInterval(this.processCheckIntervalId);
			this.processCheckIntervalId = null;
			logger.log("debug", "handleExit: Cleared process polling interval.");
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
		// Only try to kill if it's the directly spawned process and it hasn't already exited
		if (this.process && !this.process.killed) {
			logger.log(
				"info",
				`cleanupResources: Attempting to terminate directly spawned process ${this.process.pid} for ${this.gameName}.`,
			);
			this.process.kill("SIGTERM"); // Send SIGTERM to the directly controlled child process
		}
		this.process = null;
		this.trackedProcessInfo = null; // Clear tracked info
		if (this.achievementItem?.watcher_instance) {
			this.achievementItem.watcher_instance.destroy();
			logger.log(
				"debug",
				`cleanupResources: Destroyed achievement watcher for ${this.gameName}.`,
			);
		}
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

		// First, check if we have a direct ChildProcess handle
		if (this.process) {
			logger.log(
				"debug",
				`stop: Killing directly spawned process ${this.process.pid} for ${this.gameName}.`,
			);
			this.process.kill("SIGTERM");
		} else if (this.trackedProcessInfo?.pid) {
			// If no direct handle but we have a tracked PID (e.g., from an admin launch)
			try {
				logger.log(
					"debug",
					`stop: Attempting to kill tracked PID ${this.trackedProcessInfo.pid} for ${this.gameName} via process.kill.`,
				);
				process.kill(this.trackedProcessInfo.pid, "SIGTERM");
				logger.log(
					"info",
					`stop: Sent SIGTERM to PID ${this.trackedProcessInfo.pid}`,
				);
			} catch (err) {
				logger.log(
					"warn",
					`stop: Could not kill process ${this.trackedProcessInfo.pid} for ${this.gameName}: ${(err as Error).message}. Forcing stop tracking.`,
				);
				// If killing by PID fails (e.g., process already dead or permission issue), force stop tracking
				this.handleExit(0, null);
			}
		} else {
			logger.log(
				"warn",
				`stop: Cannot directly kill elevated game ${this.id} as PID is unknown and no direct handle. Stopping tracking.`,
			);
			// If no PID is tracked and no direct handle, just stop tracking
			this.handleExit(0, null);
		}
	}

	// Public method to check if game is currently running
	public async isRunning(): Promise<boolean> {
		if (!this.isActive) {
			logger.log(
				"debug",
				`isRunning: Game ${this.id} is not active. Returning false.`,
			);
			return false;
		}
		if (!this.trackedProcessInfo) {
			// Should not happen if isActive is true
			logger.log(
				"debug",
				`isRunning: Game ${this.id} has no tracked info. Returning false.`,
			);
			return false;
		}

		// Use the more efficient check from `isGameProcessRunning`
		const result = await this.isGameProcessRunning();
		logger.log(
			"debug",
			`isRunning: Check complete for ${this.gameName}. Result: ${result}.`,
		);
		return result;
	}

	// Get current session info
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
