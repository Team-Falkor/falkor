import type { ChildProcess } from "node:child_process";
import EventEmitter from "node:events";
import fs from "node:fs";
import path from "node:path";

import { db } from "@backend/database";
import { libraryGames } from "@backend/database/schemas";
import logger from "@backend/handlers/logging";
import {
	findProcessByName,
	isProcessRunning,
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
				game_id: this.id.toString(),
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
				// We have direct control over the process
				this.process.unref();
				this.process.once("exit", (code, signal) =>
					this.handleExit(code, signal),
				);
				this.process.once("error", (err) =>
					logger.log("error", `Error with spawned process: ${err.message}`),
				);

				logger.log(
					"info",
					`Launched ${this.id} with direct control (PID: ${this.trackedProcessInfo.pid}).`,
				);
			} else {
				logger.log(
					"info",
					`Launched ${this.id} via admin elevation. Waiting for process to start...`,
				);

				const detectedPid = await waitForProcessToStart(
					spawnResult.processName,
					15000,
				);

				if (detectedPid) {
					this.trackedProcessInfo.pid = detectedPid;
					logger.log("info", `Game process detected with PID: ${detectedPid}`);
				} else {
					logger.log(
						"warn",
						"Could not detect game process, will rely on name-based polling",
					);
				}

				this.startProcessPolling();
			}

			this.startTracking();
			if (this.achievementItem) this.achievementItem.find();

			gamesLaunched.set(this.id, this);
		} catch (err) {
			logger.log(
				"error",
				`Failed to launch ${this.id}: ${(err as Error).message}`,
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
		logger.log("info", `Started tracking session for ${this.id}.`);
	}

	private updateSessionTime(): void {
		if (!this.isActive) return;
		const now = Date.now();
		const delta = now - this.startTime;
		this.startTime = now;
		this.totalPlaytimeMs += delta;
		logger.log(
			"debug",
			`Session +${ms(delta)}; total ${ms(this.totalPlaytimeMs)}.`,
		);
	}

	private startProcessPolling(): void {
		this.processCheckIntervalId = setInterval(async () => {
			if (!this.isActive) {
				if (this.processCheckIntervalId) {
					clearInterval(this.processCheckIntervalId);
					this.processCheckIntervalId = null;
				}
				return;
			}

			const isRunning = await this.isGameProcessRunning();
			if (!isRunning) {
				logger.log(
					"info",
					`Detected ${this.gameName} process has exited via polling.`,
				);
				this.handleExit(0, null);
			}
		}, ms("3s")); // Check every 3 seconds for better responsiveness

		logger.log("info", `Started polling for ${this.gameName} process.`);
	}

	private async isGameProcessRunning(): Promise<boolean> {
		if (!this.trackedProcessInfo) return false;

		try {
			// If we have a specific PID, check that first
			if (this.trackedProcessInfo.pid) {
				const pids = await findProcessByName(this.trackedProcessInfo.name);
				return pids.includes(this.trackedProcessInfo.pid);
			}

			// Otherwise, check by process name
			return await isProcessRunning(this.trackedProcessInfo.name);
		} catch (error) {
			logger.log(
				"error",
				`Error checking process status: ${(error as Error).message}`,
			);
			return false;
		}
	}

	private async handleExit(
		code: number | null,
		signal: NodeJS.Signals | null,
	): Promise<void> {
		logger.log("info", `Process exited: code=${code} signal=${signal}`);
		if (!this.isActive) {
			logger.log("debug", "handleExit called but game not active. Skipping.");
			return;
		}

		this.isActive = false;
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
		if (this.processCheckIntervalId) {
			clearInterval(this.processCheckIntervalId);
			this.processCheckIntervalId = null;
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
				`Playtime saved: ${ms(newPlaytime)} (session: ${ms(this.totalPlaytimeMs)}).`,
			);
		} catch (err) {
			logger.log("error", `Failed to save playtime: ${(err as Error).message}`);
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
			this.process.kill("SIGTERM");
			logger.log("info", `Terminated process ${this.id}.`);
		}
		this.process = null;
		this.trackedProcessInfo = null;
		if (this.achievementItem?.watcher_instance) {
			this.achievementItem.watcher_instance.destroy();
		}
		gamesLaunched.delete(this.id);
		logger.log("info", `Cleaned up resources for ${this.id}.`);
	}

	public async stop(): Promise<void> {
		if (this.isActive) {
			if (this.process) {
				// Direct process control
				this.process.kill("SIGTERM");
			} else if (this.trackedProcessInfo?.pid) {
				// Try to kill the process by PID
				try {
					process.kill(this.trackedProcessInfo.pid, "SIGTERM");
					logger.log(
						"info",
						`Sent SIGTERM to PID ${this.trackedProcessInfo.pid}`,
					);
				} catch (err) {
					logger.log(
						"warn",
						`Could not kill process ${this.trackedProcessInfo.pid}: ${err}`,
					);
					// Force stop tracking
					this.handleExit(0, null);
				}
			} else {
				logger.log(
					"warn",
					`Cannot directly kill elevated game ${this.id}. Stopping tracking.`,
				);
				this.handleExit(0, null);
			}
		}
	}

	// Public method to check if game is currently running
	public async isRunning(): Promise<boolean> {
		if (!this.isActive || !this.trackedProcessInfo) {
			return false;
		}

		return await this.isGameProcessRunning();
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
