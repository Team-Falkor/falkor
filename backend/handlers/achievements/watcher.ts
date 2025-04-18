import { FSWatcher, statSync, watch, WatchListener } from "node:fs";
import { platform } from "node:os";
import { setTimeout } from "node:timers/promises";

class AchievementWatcher {
  private filePath: string;
  private watcher: FSWatcher | null = null;
  private isLinux: boolean = platform() === "linux";
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1 second
  private watchOptions = {
    persistent: true,
    recursive: false,
    encoding: 'utf8' as BufferEncoding
  };

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
  async start(callback?: WatchListener<string>): Promise<void> {
    if (this.watcher) {
      console.warn("Watcher already running. Restarting...");
      await this.restart(callback);
      return;
    }

    await this.initializeWatcher(callback);
  }

  private async initializeWatcher(callback?: WatchListener<string>): Promise<void> {
    try {
      console.log(`Watching file: ${this.filePath}`);
      
      const options = this.isLinux
        ? { ...this.watchOptions, interval: 100 } // Add polling interval for Linux
        : this.watchOptions;

      this.watcher = watch(this.filePath, options, async (eventType, filename) => {
        try {
          if (callback) await callback(eventType, filename);
        } catch (error) {
          console.error(`Error in watch callback: ${error}`);
          await this.handleWatchError(callback);
        }
      });

      this.watcher.on('error', async (error) => {
        console.error(`Watch error: ${error}`);
        await this.handleWatchError(callback);
      });

      this.retryCount = 0; // Reset retry count on successful initialization
    } catch (error) {
      console.error(`Failed to initialize watcher: ${error}`);
      await this.handleWatchError(callback);
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
  async restart(callback?: WatchListener<string>): Promise<void> {
    this.destroy();
    await this.start(callback);
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

  /** Handles watch errors and implements retry logic */
  private async handleWatchError(callback?: WatchListener<string>): Promise<void> {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`Retrying watcher initialization (attempt ${this.retryCount}/${this.maxRetries})...`);
      this.destroy();
      await setTimeout(this.retryDelay);
      await this.initializeWatcher(callback);
    } else {
      console.error('Max retry attempts reached. Watcher initialization failed.');
      this.destroy();
    }
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
