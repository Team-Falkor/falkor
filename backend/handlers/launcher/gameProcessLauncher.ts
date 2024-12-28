import { ChildProcess, spawn } from "child_process";
import fs from "fs";
import ms from "ms";
import { gamesDB } from "../../sql";
import windoww from "../../utils/window";
import { AchievementItem } from "../achievements/item";
import { logger } from "../logging";
import { gamesLaunched } from "./games_launched";

interface Options {
  game_path: string;
  game_id: string;
  steam_id?: string | null;
  game_name: string;
  game_icon?: string;
}

class GameProcessLauncher {
  private gamePath: string;
  private gameId: string;
  private gameProcess: ChildProcess | null = null;
  private startDate: Date | null = null;
  private playtime: number; // Total playtime in milliseconds
  private sessionElapsed: number = 0; // Playtime for the current session
  private isPlaying: boolean = false;
  private interval: NodeJS.Timeout | null = null;

  private achivementItem: AchievementItem | null = null;

  constructor({ game_name, game_path, steam_id, game_icon, game_id }: Options) {
    if (!GameProcessLauncher.isValidExecutable(game_path)) {
      throw new Error(`Invalid game path: ${game_path}`);
    }

    this.gamePath = game_path;
    this.gameId = game_id;
    this.playtime = 0;
    if (steam_id) {
      this.achivementItem = new AchievementItem({
        game_id,
        steam_id,
        game_name,
        game_icon,
      });
    }
  }

  /**
   * Validates the game executable path.
   */
  private static isValidExecutable(gamePath: string): boolean {
    return fs.existsSync(gamePath) && fs.statSync(gamePath).isFile();
  }

  /**
   * Launches the game and sets up playtime tracking.
   */
  public launchGame(): void {
    console.log("info", `Launching game: ${this.gamePath}`);

    try {
      this.gameProcess = spawn(this.gamePath, {
        detached: true,
        stdio: "ignore",
      });
      this.gameProcess.unref();

      console.log("info", "achivement item find");
      this.achivementItem?.find();

      this.gameProcess.on("exit", (code, signal) => {
        console.log("info", `Game exited. Code: ${code}, Signal: ${signal}`);
        this.onGameExit();
      });

      this.gameProcess.on("error", (error) => {
        logger.log("error", `Game process error: ${(error as Error).message}`);
      });

      this.startGameSession();
    } catch (error) {
      logger.log("error", `Failed to launch game: ${(error as Error).message}`);
    }
  }

  /**
   * Tracks the playtime for the current session.
   */
  private trackPlayTime(): void {
    if (!this.isPlaying || !this.startDate) return;

    const now = Date.now();
    const elapsed = now - this.startDate.getTime();
    this.sessionElapsed += elapsed;
    this.playtime += elapsed;

    console.log("info", `Session playtime updated. Elapsed: ${ms(elapsed)}`);

    this.startDate = new Date(); // Reset start time
  }

  /**
   * Updates the database with the game's playtime and last played timestamp.
   */
  private async updatePlaytime(): Promise<void> {
    if (!this.gameId) return;

    try {
      await gamesDB.updateGame(this.gameId, {
        game_playtime: this.playtime,
        game_last_played: new Date(),
      });

      console.log(
        "info",
        `Playtime updated successfully. Total: ${ms(this.playtime)}`
      );
    } catch (error) {
      logger.log(
        "error",
        `Failed to update playtime: ${(error as Error).message}`
      );
    }
  }

  /**
   * Handles game exit by cleaning up resources and updating playtime.
   */
  private async onGameExit(): Promise<void> {
    this.trackPlayTime();
    await this.updatePlaytime();
    this.cleanup();

    windoww.emitToFrontend("game:stopped", this.gameId);
  }

  /**
   * Cleans up the game session.
   */
  private cleanup(): void {
    try {
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }

      if (this.gameProcess && !this.gameProcess.killed) {
        this.gameProcess.kill("SIGTERM");
        console.log("info", "Game process terminated.");
      }

      if (this.achivementItem) this.achivementItem?.watcher_instance?.destroy();
    } catch (error) {
      logger.log("error", `Error during cleanup: ${(error as Error).message}`);
    }

    this.gameProcess = null;
    this.startDate = null;
    this.isPlaying = false;

    gamesLaunched.delete(this.gameId);
  }

  /**
   * Stops the game process manually.
   */
  public stopGame(): void {
    if (this.isPlaying) {
      this.trackPlayTime();
      this.cleanup();
    }
  }

  /**
   * Initializes game play session tracking.
   */
  private startGameSession(): void {
    this.startDate = new Date();
    this.sessionElapsed = 0;
    this.isPlaying = true;

    this.interval = setInterval(() => this.trackPlayTime(), ms("1m"));
    windoww.emitToFrontend("game:playing", this.gameId);

    console.log("info", "Game session started.");
  }
}

export default GameProcessLauncher;
