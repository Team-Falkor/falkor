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
					`Launched ${this.gameName} (ID: ${this.id}) with direct control (PID: ${this.trackedProcessInfo.pid}).`,
				);
			} else {
				logger.log(
					"info",
					`Launched ${this.gameName} (ID: ${this.id}) via admin elevation. Attempting to detect process...`,
				);

				const detectedPid = await waitForProcessToStart(
					spawnResult.processName,
				);

				if (detectedPid) {
					this.trackedProcessInfo.pid = detectedPid;
					logger.log("info", `Game process detected with PID: ${detectedPid}`);
				} else {
					logger.log(
						"warn",
						`Could not detect game process for '${this.gameName}' immediately after admin launch. Starting name-based polling.`,
					);
				}
			}

			this.startTracking();
			this.startProcessPolling();
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

			const isRunning = await this.isGameProcessRunning();
			if (!isRunning) {
				logger.log(
					"info",
					`Detected ${this.gameName} process has exited via polling.`,
				);
				this.handleExit(0, null);
			}
		}, ms("3s"));
	}

	private async isGameProcessRunning(): Promise<boolean> {
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
				const pids = await findProcessByName(processName);
				if (pids.length > 0) {
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
				`isGameProcessRunning: Error checking status for '${processName}': ${(error as Error).message}`,
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
		if (this.process && !this.process.killed) {
			logger.log(
				"info",
				`cleanupResources: Attempting to terminate directly spawned process ${this.process.pid} for ${this.gameName}.`,
			);
			this.process.kill("SIGTERM");
		}
		this.process = null;
		this.trackedProcessInfo = null;
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

		if (this.process) {
			logger.log(
				"debug",
				`stop: Killing directly spawned process ${this.process.pid} for ${this.gameName}.`,
			);
			this.process.kill("SIGTERM");
		} else if (this.trackedProcessInfo?.pid) {
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
