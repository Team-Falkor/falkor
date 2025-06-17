import type { ChildProcess } from "node:child_process";
import { exec } from "node:child_process";
import EventEmitter from "node:events";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import util from "node:util";

import { db } from "@backend/database";
import { libraryGames } from "@backend/database/schemas";
import logger from "@backend/handlers/logging";
import { safeSpawn } from "@backend/utils/process-spawning";
import { eq } from "drizzle-orm";
import ms from "ms";
import { AchievementItem } from "../achievements/item";
import { gamesLaunched } from "./games-launched";
import { resolveExecutablePath } from "./utils/process-utils";

interface TrackedProcessInfo {
	pid: number | null;
	name: string;
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

	public launch(args: string[] = []): void {
		if (this.isActive) {
			logger.log("warn", `Game ${this.id} is already running.`);
			return;
		}

		const executable = this.commandOverride || this.gamePath;
		const spawnArgs = this.commandOverride ? [this.gamePath, ...args] : args;

		try {
			this.process = safeSpawn(executable, spawnArgs, {
				cwd: process.cwd(),
				runAsAdmin: this.runAsAdmin,
				stdio: this.runAsAdmin ? "inherit" : "pipe",
			});

			if (this.process) {
				this.process.unref();
				this.process.once("exit", (code, signal) =>
					this.handleExit(code, signal),
				);
				this.process.once("error", (err) =>
					logger.log("error", `Error with spawned process: ${err.message}`),
				);
				this.trackedProcessInfo = {
					pid: this.process.pid !== undefined ? this.process.pid : null,
					name: this.gameName,
				};
				logger.log(
					"info",
					`Launched ${this.id} with direct control (PID: ${this.trackedProcessInfo.pid}).`,
				);
			} else {
				logger.log(
					"warn",
					`Launched ${this.id} via external elevation. Will poll for process exit.`,
				);
				this.trackedProcessInfo = { pid: null, name: this.gameName };
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
		}, ms("5s"));
		logger.log("info", `Started polling for ${this.gameName} process.`);
	}

	private async isGameProcessRunning(): Promise<boolean> {
		if (!this.trackedProcessInfo) return false;

		const platform = os.platform();
		const gameExecutableName = path.basename(this.gamePath);

		try {
			if (platform === "win32") {
				const { stdout } = await util.promisify(exec)(
					`tasklist /nh /fi "imagename eq ${gameExecutableName}"`,
				);
				return stdout.includes(gameExecutableName);
			}
			if (platform === "darwin" || platform === "linux") {
				const { stdout } = await util.promisify(exec)(
					`pgrep -x "${gameExecutableName}"`,
				);
				return stdout.trim().length > 0;
			}
		} catch (error) {
			const err = error as { code?: number; message: string };
			if (err.code === 1) {
				return false;
			}
			logger.log("error", `Error checking process status: ${err.message}`);
		}
		return true;
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

			logger.info(`Playtime saved: ${ms(newPlaytime)}.`);
		} catch (err) {
			logger.error(`Failed to save playtime: ${(err as Error).message}`);
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

	public stop(): void {
		if (this.isActive) {
			if (this.process) {
				this.process.kill("SIGTERM");
			} else {
				logger.log(
					"warn",
					`Cannot directly kill elevated game ${this.id}. Stopping tracking.`,
				);
				this.handleExit(0, null);
			}
		}
	}
}
