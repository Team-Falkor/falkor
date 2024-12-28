import { FSWatcher, watch, WatchListener } from "node:fs";

class AchievementWatcher {
  private filePath: string;
  private watcher: FSWatcher | null = null;

  constructor(filePath: string) {
    if (!filePath) {
      throw new Error("filePath are required.");
    }
    this.filePath = filePath;
  }

  /** Initializes the watcher if not already started */
  start(callback?: WatchListener<string>): void {
    if (this.watcher) {
      console.warn("Watcher already running. Restarting...");
      this.restart();
      return;
    }
    console.log(`Watching file: ${this.filePath}`);
    this.watcher = watch(this.filePath, callback);
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
  restart(): void {
    this.destroy();
    this.start();
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
