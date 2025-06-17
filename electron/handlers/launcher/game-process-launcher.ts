import type { ChildProcess } from "node:child_process";
import EventEmitter from "node:events";
import fs from "node:fs";
import { db } from "@backend/database";
import { libraryGames } from "@backend/database/schemas";
import { exec } from "@expo/sudo-prompt"; // CORRECTED IMPORT
import { eq } from "drizzle-orm";
import ms from "ms";
import open from "open";
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
	runAsAdmin?: boolean;
}

export default class GameProcessLauncher extends EventEmitter {
	private readonly gameId: string;
	private readonly gamePath: string;
	private readonly commandOverride?: string;
	private readonly achievementItem?: AchievementItem;
	private readonly launchType: "file" | "url";

	private process: ChildProcess | null = null;
	private startTime = 0;
	private totalPlaytimeMs = 0;
	private intervalId: NodeJS.Timeout | null = null;
	private isActive = false;

	constructor(opts: LauncherOptions) {
		super();

		this.gameId = opts.gameId;
		this.commandOverride = opts.commandOverride;

		// Determine the launch strategy based on the gamePath format
		if (opts.gamePath.startsWith("steam://")) {
			this.launchType = "url";
			this.gamePath = opts.gamePath; // The path is the URL itself
			logger.log("info", `Identified URL-based game: ${this.gamePath}`);
		} else if (opts.gamePath.toLowerCase().endsWith(".url")) {
			// Handle Windows Internet Shortcut files (.url)
			logger.log("info", `Identified a .url shortcut: ${opts.gamePath}`);
			const fileContent = fs.readFileSync(opts.gamePath, "utf-8");
			const match = fileContent.match(/^URL=(.*)$/m);
			if (match?.[1]) {
				this.launchType = "url";
				this.gamePath = match[1].trim(); // The real path is the extracted URL
				logger.log("info", `Extracted target URL: ${this.gamePath}`);
			} else {
				throw new Error(`Invalid or malformed .url file: ${opts.gamePath}`);
			}
		} else {
			// This is the original logic for file-based games
			this.launchType = "file";
			const resolvedPath = resolveExecutablePath(opts.gamePath);
			if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) {
				throw new Error(`Invalid executable file path: ${opts.gamePath}`);
			}
			this.gamePath = resolvedPath;
		}

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

	/**
	 * Launches a game with elevated privileges. This is a "fire-and-forget"
	 * method and does NOT support playtime tracking or process management.
	 */
	public async launchAsAdmin(args: string[] = []): Promise<void> {
		if (this.launchType !== "file") {
			throw new Error(
				"Cannot launch as admin: This feature is only available for file-based games, not URL protocols.",
			);
		}

		logger.log("info", `Attempting to launch ${this.gameId} as admin.`);
		const fullCommand = [`"${this.gamePath}"`, ...args].join(" ");

		try {
			await exec(fullCommand, { name: "Falkor App" });
			logger.log("info", `Successfully launched ${this.gameId} as admin.`);
		} catch (error) {
			logger.error(`Failed to launch ${this.gameId} as admin: ${error}`);
			throw error;
		}
	}

	/**
	 * Launches the game using the determined strategy and begins tracking.
	 */
	public async launch(args: string[] = []): Promise<void> {
		if (this.isActive) {
			logger.log("warn", `Game ${this.gameId} is already running.`);
			return;
		}

		try {
			if (this.launchType === "url") {
				// Use 'open' for protocols like steam:// to get a process handle
				this.process = await open(this.gamePath, { wait: false });
			} else {
				// Use 'safeSpawn' for direct file execution
				const executable = this.commandOverride || this.gamePath;
				const spawnArgs = this.commandOverride
					? [this.gamePath, ...args]
					: args;
				this.process = safeSpawn(executable, spawnArgs, { cwd: process.cwd() });
			}

			// This tracking logic now works for BOTH launch types
			this.process.unref();
			this.process.once("exit", (code, signal) =>
				this.handleExit(code, signal),
			);
			this.process.once("error", (err) =>
				logger.log("error", `Error launching process: ${err.message}`),
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
			throw err;
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
