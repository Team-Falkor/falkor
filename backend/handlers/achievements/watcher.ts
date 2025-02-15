import { FSWatcher, statSync, watch, WatchListener } from "node:fs";
import { platform } from "node:os";

class AchievementWatcher {
  private filePath: string;
  private watcher: FSWatcher | null = null;
  private isLinux: boolean = platform() === "linux";

  constructor(filePath: string) {
    if (!filePath) {
      throw new Error("filePath is required.");
    }
    this.filePath = filePath;

    // Validate file path exists and is accessible
    try {
      const stats = statSync(this.filePath);
      if (!stats.isFile()) {
        throw new Error("Provided path is not a file.");
      }
    } catch (err) {
      throw new Error(`Invalid file path: ${(err as Error).message}`);
    }
  }

  /** Initializes the watcher if not already started */
  start(callback?: WatchListener<string>): void {
    if (this.watcher) {
      console.warn("Watcher already running. Restarting...");
      this.restart(callback);
      return;
    }

    console.log(`Watching file: ${this.filePath}`);
    if (this.isLinux) {
      console.log("Using Linux-compatible watcher settings.");
      this.watcher = watch(this.filePath, { persistent: true }, callback);
    } else {
      console.log("Using default watcher settings.");
      this.watcher = watch(this.filePath, callback);
    }
  }

  /** Closes and nullifies the watcher */
  destroy(): void {
    if (!this.watcher) {
      console.warn("Watcher is not running. Nothing to destroy.");
      return;
    }
    this.watcher.close();
    this.watcher = null;
  }

  /** Restarts the watcher */
  restart(callback?: WatchListener<string>): void {
    this.destroy();
    this.start(callback);
  }

  /** Attaches an event listener to the watcher */
  on(event: string, listener: (...args: unknown[]) => void): void {
    this.ensureWatcher();
    this.watcher?.on(event, listener);
  }

  /** Attaches a one-time event listener to the watcher */
  once(event: string, listener: (...args: unknown[]) => void): void {
    this.ensureWatcher();
    this.watcher?.once(event, listener);
  }

  /** Removes an event listener from the watcher */
  off(event: string, listener: (...args: unknown[]) => void): void {
    this.ensureWatcher();
    this.watcher?.off(event, listener);
  }

  /** Emits an event manually */
  emit(event: string, ...args: unknown[]): void {
    this.ensureWatcher();
    this.watcher?.emit(event, ...args);
  }

  /** Checks if the watcher is currently running */
  isRunning(): boolean {
    return this.watcher !== null;
  }

  /** Logs the status of the watcher */
  logStatus(): void {
    console.log("Watcher Status:");
    console.log(`File Path: ${this.filePath}`);
    console.log(`Running: ${this.isRunning()}`);
    console.log(`Platform: ${this.isLinux ? "Linux" : "Other (Windows/Mac)"}`);
  }

  /** Ensures that the watcher is initialized before performing operations */
  private ensureWatcher(): void {
    if (!this.watcher) {
      throw new Error(
        "Watcher is not initialized. Start the watcher before performing this operation."
      );
    }
  }
}

export { AchievementWatcher };
