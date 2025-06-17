import type { ChildProcess } from "node:child_process";
import EventEmitter from "node:events";
import fs from "node:fs";
import { db } from "@backend/database";
import { libraryGames } from "@backend/database/schemas";
import { eq } from "drizzle-orm";
import ms from "ms";
import { AchievementItem } from "../achievements/item";
import logger from "../logging";
import { gamesLaunched } from "./games-launched";
import { resolveExecutablePath, safeSpawn } from "./utils/process-utils";

interface LauncherOptions {
	gamePath: string;
	gameId: string;
	steamId?: string;
	gameName: string;
	gameIcon?: string;
	gameArgs?: string[];
	commandOverride?: string;
	winePrefixPath?: string;
}

export default class GameProcessLauncher extends EventEmitter {
	private readonly gameId: string;
	private readonly gamePath: string;
	private readonly commandOverride?: string;
	private readonly achievementItem?: AchievementItem;

	private process: ChildProcess | null = null;
	private startTime = 0;
	private totalPlaytimeMs = 0;
	private intervalId: NodeJS.Timeout | null = null;
	private isActive = false;

	constructor(opts: LauncherOptions) {
		super();
		const resolvedPath = resolveExecutablePath(opts.gamePath);
		if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) {
			throw new Error(`Invalid executable: ${opts.gamePath}`);
		}

		this.gameId = opts.gameId;
		this.gamePath = resolvedPath;
		this.commandOverride = opts.commandOverride;

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

	/** Launches the game process and begins tracking. */
	public launch(args: string[] = []): void {
		if (this.isActive) {
			logger.log("warn", `Game ${this.gameId} is already running.`);
			return;
		}

		const executable = this.commandOverride || this.gamePath;
		const spawnArgs = this.commandOverride ? [this.gamePath, ...args] : args;

		try {
			this.process = safeSpawn(executable, spawnArgs, { cwd: process.cwd() });
			this.process.unref();

			this.process.once("exit", (code, signal) =>
				this.handleExit(code, signal),
			);
			this.process.once("error", (err) =>
				logger.log("error", `Error: ${err.message}`),
			);

			this.startTracking();
			if (this.achievementItem) this.achievementItem.find();

			gamesLaunched.set(this.gameId, this);
			logger.log("info", `Launched ${this.gameId} successfully.`);
		} catch (err) {
			logger.log(
				"error",
				`Failed to launch ${this.gameId}: ${(err as Error).message}`,
			);
		}
	}

	/** Initiates playtime tracking. */
	private startTracking(): void {
		this.startTime = Date.now();
		this.isActive = true;
		this.emit("game:playing", this.gameId);

		this.intervalId = setInterval(() => this.updateSessionTime(), ms("1m"));
		logger.log("info", `Started tracking session for ${this.gameId}.`);
	}

	/** Updates session and accumulates playtime. */
	private updateSessionTime(): void {
		if (!this.isActive) return;
		const now = Date.now();
		const delta = now - this.startTime;
		this.startTime = now;
		this.totalPlaytimeMs += delta;
		logger.log(
			"info",
			`Session +${ms(delta)}; total ${ms(this.totalPlaytimeMs)}.`,
		);
	}

	/** Handles process exit, cleanup, and DB update. */
	private async handleExit(
		code: number | null,
		signal: NodeJS.Signals | null,
	): Promise<void> {
		logger.log("info", `Process exited: code=${code} signal=${signal}`);
		this.isActive = false;
		if (this.intervalId) clearInterval(this.intervalId);

		await this.commitPlaytime();
		this.cleanupResources();
		this.emit("game:stopped", this.gameId);
	}

	/** Persists playtime to the database. */
	private async commitPlaytime(): Promise<void> {
		try {
			const game = await this.findGameById(this.gameId);
			const newPlaytime = (game.gamePlaytime ?? 0) + this.totalPlaytimeMs;

			await db
				.update(libraryGames)
				.set({
					gamePlaytime: newPlaytime,
					gameLastPlayed: new Date(),
				})
				.where(eq(libraryGames.gameId, this.gameId));

			logger.info(`Playtime saved: ${ms(newPlaytime)}.`);
		} catch (err) {
			logger.error(`Failed to save playtime: ${(err as Error).message}`);
		}
	}

	/** Fetches a game by its ID or throws an error if not found. */
	private async findGameById(gameId: string) {
		const game = await db
			.select()
			.from(libraryGames)
			.where(eq(libraryGames.gameId, gameId))
			.get();

		if (!game) {
			throw new Error(`Game not found: ${gameId}`);
		}

		return game;
	}

	/** Cleans up listeners and process resources. */
	private cleanupResources(): void {
		if (this.process && !this.process.killed) {
			this.process.kill("SIGTERM");
			logger.log("info", `Terminated process ${this.gameId}.`);
		}
		this.process = null;
		this.achievementItem?.watcher_instance?.destroy();
		gamesLaunched.delete(this.gameId);
	}

	/** Stops the game and tracking manually. */
	public stop(): void {
		if (this.isActive && this.process) {
			this.process.kill("SIGTERM");
		}
	}
}
