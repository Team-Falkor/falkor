import EventEmitter from "node:events";
import { db } from "@backend/database";
import { libraryGames } from "@backend/database/schemas";
import logger from "@backend/handlers/logging";
import type { Game } from "@team-falkor/game-launcher";
import { eq } from "drizzle-orm";
import { AchievementItem } from "../achievements/item";
import { gamesLaunched } from "./games-launched";
import { gameLauncher } from "./launcher";

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
	private readonly achievementItem?: AchievementItem;
	private game: Game | null = null;

	constructor(private opts: LauncherOptions) {
		super();

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

	async launchGame() {
		const gameLaunched = await gameLauncher.launchGame({
			gameId: this.opts.gameId,
			executable: this.opts.gamePath,
			args: this.opts.gameArgs,
			runAsAdmin: this.opts.runAsAdmin,
		});

		this.game = gameLaunched;
		gamesLaunched.set(this.opts.id, this);

		if (this.achievementItem) {
			try {
				this.achievementItem.find();
				logger.log(
					"info",
					`Achievement tracking started for ${this.opts.gameName}`,
				);
			} catch (error) {
				logger.log(
					"error",
					`Failed to start achievement tracking: ${(error as Error).message}`,
				);
			}
		}
	}

	async closeGame() {
		if (!this.game) return;
		this.game.close();
	}

	private findGameById(id: number) {
		const game = db
			.select()
			.from(libraryGames)
			.where(eq(libraryGames.id, id))
			.get();

		if (!game) {
			throw new Error(`Game not found: ${id}`);
		}

		return game;
	}

	async updatePlaytime(durationMs: number) {
		const game = this.findGameById(this.opts.id);

		const newPlaytime = (game.gamePlaytime ?? 0) + durationMs;
		await db
			.update(libraryGames)
			.set({
				gamePlaytime: newPlaytime,
			})
			.where(eq(libraryGames.id, this.opts.id));
	}

	async setupEventListeners() {
		if (!this.game) {
			throw new Error("Game not launched");
		}

		this.game.on("closed", async (data) => {
			this.emit("exit", data);
			await this.updatePlaytime(data.duration);
			await this.destroy();
		});
	}

	async destroy() {
		gamesLaunched.delete(this.opts.id);
		this.game?.removeAllListeners();
		this.game = null;

		if (this.achievementItem?.watcher_instance) {
			try {
				this.achievementItem.watcher_instance.destroy();
				logger.log(
					"debug",
					`cleanupResources: Destroyed achievement watcher for ${this.opts.gameName}.`,
				);
			} catch (error) {
				logger.log(
					"warn",
					`cleanupResources: Failed to destroy achievement watcher: ${(error as Error).message}`,
				);
			}
		}
	}
}
