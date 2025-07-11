import EventEmitter from "node:events";
import { db } from "@backend/database";
import { libraryGames } from "@backend/database/schemas";
import logger from "@backend/handlers/logging";
import type { Game, GameClosedEvent } from "@team-falkor/game-launcher";
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

		// Safety timeout to detect missed close events
		let closeEventReceived = false;
		const safetyTimeout = setTimeout(() => {
			if (!closeEventReceived && this.game) {
				console.warn(
					`Safety timeout: Game ${this.opts.gameId} may have closed without event`,
				);
				// Check if process is actually still running
				if (!gameLauncher.isGameRunning(this.opts.gameId)) {
					this.handleGameClosed({ gameId: this.opts.gameId, duration: 0 });
				}
			}
		}, 30000); // 30 second safety net

		gameLaunched.on("launched", (data) => {
			console.log("Game launched", data);
		});

		gameLaunched.on("closed", async (data) => {
			closeEventReceived = true;
			clearTimeout(safetyTimeout);
			console.log("Game closed", data);
			await this.handleGameClosed(data);
		});

		gameLaunched.on("statusChange", (data) => {
			console.log(`Game ${this.opts.gameId} status changed:`, data);
		});

		gameLaunched.on("error", (error) => {
			console.error(`Game ${this.opts.gameId} error:`, error);
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

	private async handleGameClosed(data: Partial<GameClosedEvent>) {
		this.emit("exit", data);
		await this.updatePlaytime(data.duration || 0);
		await this.destroy();
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

		try {
			const newPlaytime = (game.gamePlaytime ?? 0) + durationMs;
			await db
				.update(libraryGames)
				.set({
					gamePlaytime: newPlaytime,
				})
				.where(eq(libraryGames.id, this.opts.id));

			console.log("Playtime updated", newPlaytime);
		} catch (error) {
			logger.log(
				"error",
				`Failed to update playtime: ${(error as Error).message}`,
			);
		}
	}

	async destroy() {
		// Remove from games launched first
		gamesLaunched.delete(this.opts.id);

		// Clean up achievement watcher
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

		// Clean up game reference last, after a small delay to ensure events are processed
		if (this.game) {
			setTimeout(() => {
				this.game?.removeAllListeners();
				this.game = null;
			}, 300);
		}
	}
}
