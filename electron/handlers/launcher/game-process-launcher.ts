import type { ChildProcess } from "node:child_process";
import EventEmitter from "node:events";
import fs from "node:fs";
import path from "node:path";

import { db } from "@backend/database";
import { libraryGames } from "@backend/database/schemas";
import logger from "@backend/handlers/logging";
import {
  findProcessByName,
  safeSpawn,
  waitForProcessToStart,
} from "@backend/utils/process-spawning";
import { eq } from "drizzle-orm";
import ms from "ms";
import { AchievementItem } from "../achievements/item";
import { gamesLaunched } from "./games-launched";
import { resolveExecutablePath } from "./utils/process-utils";

// Enhanced error types for better error handling
export enum LaunchError {
	EXECUTABLE_NOT_FOUND = "EXECUTABLE_NOT_FOUND",
	INVALID_PATH = "INVALID_PATH",
	PERMISSION_DENIED = "PERMISSION_DENIED",
	ALREADY_RUNNING = "ALREADY_RUNNING",
	SPAWN_FAILED = "SPAWN_FAILED",
	TIMEOUT = "TIMEOUT",
	UNKNOWN = "UNKNOWN",
}

// Launch status for user feedback
enum LaunchStatus {
	IDLE = "idle",
	VALIDATING = "validating",
	LAUNCHING = "launching",
	DETECTING = "detecting",
	RUNNING = "running",
	STOPPING = "stopping",
	ERROR = "error",
}

export class LaunchOperationError extends Error {
	constructor(
		public readonly errorType: LaunchError,
		message: string,
		public readonly details?: Record<string, unknown>,
	) {
		super(message);
		this.name = "LaunchOperationError";
	}
}

interface TrackedProcessInfo {
	pid: number | null;
	name: string;
	requiresPolling: boolean;
	pollingFailureCount: number;
	maxPollingFailures: number;
}

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
	private adminLaunchDetectionTimeout: NodeJS.Timeout | null = null;

	// Enhanced status tracking and retry mechanisms
	private currentStatus: LaunchStatus = LaunchStatus.IDLE;
	private launchAttempts = 0;
	private readonly maxLaunchAttempts = 3;
	private readonly launchTimeout = 30000; // 30 seconds
	private launchTimeoutId: NodeJS.Timeout | null = null;
	private lastError: LaunchOperationError | null = null;
	private performanceMetrics = {
		launchStartTime: 0,
		detectionTime: 0,
		totalLaunchTime: 0,
	};

	constructor(opts: LauncherOptions) {
		super();

		// Enhanced validation with better error messages
		this.validateLauncherOptions(opts);

		const resolvedPath = resolveExecutablePath(opts.gamePath);
		if (!fs.existsSync(resolvedPath)) {
			throw new LaunchOperationError(
				LaunchError.EXECUTABLE_NOT_FOUND,
				`Executable not found: ${opts.gamePath}`,
				{ originalPath: opts.gamePath, resolvedPath },
			);
		}

		try {
			if (!fs.statSync(resolvedPath).isFile()) {
				throw new LaunchOperationError(
					LaunchError.INVALID_PATH,
					`Path is not a file: ${resolvedPath}`,
					{ path: resolvedPath },
				);
			}
		} catch (e) {
			throw new LaunchOperationError(
				LaunchError.PERMISSION_DENIED,
				`Cannot access path: ${resolvedPath}. Check permissions.`,
				{ path: resolvedPath, originalError: e },
			);
		}

		this.id = opts.id;
		this.gamePath = resolvedPath;
		this.commandOverride = opts.commandOverride;
		this.runAsAdmin = opts.runAsAdmin ?? false;
		this.gameName = opts.gameName;

		if (opts.steamId) {
			this.achievementItem = new AchievementItem({
				game_id: opts.gameId,
				steam_id: opts.steamId,
				game_name: opts.gameName,
				game_icon: opts.gameIcon,
				wine_prefix_folder: opts.winePrefixPath,
			});
		}

		logger.log(
			"debug",
			`GameProcessLauncher initialized for ${this.gameName} (ID: ${this.id})`,
		);
	}

	private validateLauncherOptions(opts: LauncherOptions): void {
		if (!opts.gamePath || typeof opts.gamePath !== "string") {
			throw new LaunchOperationError(
				LaunchError.EXECUTABLE_NOT_FOUND,
				"Game path is required and must be a string",
				{ options: opts },
			);
		}

		if (!opts.gameName || typeof opts.gameName !== "string") {
			throw new LaunchOperationError(
				LaunchError.UNKNOWN,
				"Game name is required and must be a string",
				{ options: opts },
			);
		}

		if (typeof opts.id !== "number" || opts.id <= 0) {
			throw new LaunchOperationError(
				LaunchError.UNKNOWN,
				"Game ID must be a positive number",
				{ options: opts },
			);
		}
	}

	// Status tracking methods for user feedback
	private updateStatus(
		status: LaunchStatus,
		details?: Record<string, unknown>,
	): void {
		const previousStatus = this.currentStatus;
		this.currentStatus = status;

		logger.log(
			"debug",
			`Status changed: ${previousStatus} -> ${status} for ${this.gameName}`,
		);

		this.emit("status:changed", {
			gameId: this.id,
			gameName: this.gameName,
			status,
			previousStatus,
			details,
			timestamp: Date.now(),
		});
	}

	public getStatus(): LaunchStatus {
		return this.currentStatus;
	}

	public getLastError(): LaunchOperationError | null {
		return this.lastError;
	}

	public getPerformanceMetrics() {
		return { ...this.performanceMetrics };
	}

	public async launch(args: string[] = []): Promise<void> {
		if (this.isActive) {
			const error = new LaunchOperationError(
				LaunchError.ALREADY_RUNNING,
				`Game ${this.gameName} is already running`,
				{ gameId: this.id, gameName: this.gameName },
			);
			this.lastError = error;
			logger.log("warn", error.message);
			throw error;
		}

		// Reset state for new launch attempt
		this.lastError = null;
		this.launchAttempts = 0;
		this.performanceMetrics.launchStartTime = Date.now();

		return this.attemptLaunch(args);
	}

	private async attemptLaunch(args: string[]): Promise<void> {
		this.launchAttempts++;

		logger.log(
			"info",
			`Launch attempt ${this.launchAttempts}/${this.maxLaunchAttempts} for ${this.gameName}`,
		);

		try {
			this.updateStatus(LaunchStatus.VALIDATING, {
				attempt: this.launchAttempts,
			});

			// Pre-launch validation
			await this.validatePreLaunch();

			this.updateStatus(LaunchStatus.LAUNCHING);

			// Set up launch timeout
			this.setupLaunchTimeout();

			const executable = this.commandOverride || this.gamePath;
			const spawnArgs = this.commandOverride ? [this.gamePath, ...args] : args;

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
				pollingFailureCount: 0,
				maxPollingFailures: 10,
			};

			if (this.process) {
				await this.handleDirectProcessLaunch();
			} else {
				await this.handleAdminProcessLaunch(spawnResult.processName);
			}

			// Clear launch timeout on successful launch
			this.clearLaunchTimeout();

			// Start tracking and polling
			this.startTracking();
			if (this.achievementItem) this.achievementItem.find();
			this.startProcessPolling();

			gamesLaunched.set(this.id, this);

			// Calculate performance metrics
			this.performanceMetrics.totalLaunchTime =
				Date.now() - this.performanceMetrics.launchStartTime;

			logger.log(
				"info",
				`Successfully launched ${this.gameName} in ${this.performanceMetrics.totalLaunchTime}ms`,
			);
		} catch (err) {
			this.clearLaunchTimeout();

			const error =
				err instanceof LaunchOperationError
					? err
					: new LaunchOperationError(
							LaunchError.SPAWN_FAILED,
							`Failed to launch ${this.gameName}: ${(err as Error).message}`,
							{
								gameId: this.id,
								gameName: this.gameName,
								attempt: this.launchAttempts,
								originalError: err,
							},
						);

			this.lastError = error;
			this.updateStatus(LaunchStatus.ERROR, {
				error: error.message,
				attempt: this.launchAttempts,
			});

			logger.log(
				"error",
				`Launch attempt ${this.launchAttempts} failed: ${error.message}`,
			);

			// Retry logic
			if (
				this.launchAttempts < this.maxLaunchAttempts &&
				this.shouldRetry(error)
			) {
				const retryDelay = this.calculateRetryDelay();
				logger.log("info", `Retrying launch in ${retryDelay}ms...`);

				await new Promise((resolve) => setTimeout(resolve, retryDelay));
				return this.attemptLaunch(args);
			}

			this.cleanupResources();
			throw error;
		}
	}

	private async validatePreLaunch(): Promise<void> {
		// Check if executable still exists
		if (!fs.existsSync(this.gamePath)) {
			throw new LaunchOperationError(
				LaunchError.EXECUTABLE_NOT_FOUND,
				`Executable no longer exists: ${this.gamePath}`,
				{ path: this.gamePath },
			);
		}

		// Check if another instance is already running
		if (gamesLaunched.has(this.id)) {
			throw new LaunchOperationError(
				LaunchError.ALREADY_RUNNING,
				"Game instance already exists in launcher registry",
				{ gameId: this.id },
			);
		}
	}

	private setupLaunchTimeout(): void {
		this.launchTimeoutId = setTimeout(() => {
			const error = new LaunchOperationError(
				LaunchError.TIMEOUT,
				`Launch timeout after ${this.launchTimeout}ms`,
				{ timeout: this.launchTimeout, gameId: this.id },
			);

			this.lastError = error;
			this.updateStatus(LaunchStatus.ERROR, { error: error.message });
			this.cleanupResources();

			logger.log("error", error.message);
		}, this.launchTimeout);
	}

	private clearLaunchTimeout(): void {
		if (this.launchTimeoutId) {
			clearTimeout(this.launchTimeoutId);
			this.launchTimeoutId = null;
		}
	}

	private async handleDirectProcessLaunch(): Promise<void> {
		if (!this.process) return;

		this.process.once("exit", (code, signal) => {
			logger.log(
				"info",
				`Direct process exit detected: PID ${this.process?.pid}, code=${code}, signal=${signal}`,
			);
			this.handleExit(code, signal);
		});

		this.process.once("error", (err) => {
			const error = new LaunchOperationError(
				LaunchError.SPAWN_FAILED,
				`Process error: ${err.message}`,
				{ pid: this.process?.pid, originalError: err },
			);

			this.lastError = error;
			logger.log("error", error.message);
			this.updateStatus(LaunchStatus.ERROR, { error: error.message });
		});

		this.process.once("close", (code, signal) => {
			logger.log(
				"info",
				`Process closed: PID ${this.process?.pid}, code=${code}, signal=${signal}`,
			);
			if (this.isActive) {
				this.handleExit(code, signal);
			}
		});

		this.process.once("disconnect", () => {
			logger.log("info", `Process disconnected: PID ${this.process?.pid}`);
			if (this.isActive) {
				this.handleExit(0, null);
			}
		});

		logger.log(
			"info",
			`Direct process launch successful (PID: ${this.process.pid})`,
		);
	}

	private async handleAdminProcessLaunch(processName: string): Promise<void> {
		this.updateStatus(LaunchStatus.DETECTING, { processName });

		logger.log(
			"info",
			`Admin launch initiated, detecting process: ${processName}`,
		);

		// Enhanced process detection with better timeout handling
		this.adminLaunchDetectionTimeout = setTimeout(async () => {
			this.performanceMetrics.detectionTime = Date.now();

			const detectedPid = await waitForProcessToStart(
				processName,
				500, // 500ms intervals
				40, // 20 seconds max (increased from 10)
			);

			if (detectedPid && this.trackedProcessInfo) {
				this.trackedProcessInfo.pid = detectedPid;
				this.performanceMetrics.detectionTime =
					Date.now() - this.performanceMetrics.detectionTime;

				logger.log(
					"info",
					`Process detected (PID: ${detectedPid}) in ${this.performanceMetrics.detectionTime}ms`,
				);
			} else {
				logger.log(
					"warn",
					`Process detection timeout for ${this.gameName}. Continuing with name-based polling.`,
				);
			}

			this.adminLaunchDetectionTimeout = null;
		}, 500);
	}

	private shouldRetry(error: LaunchOperationError): boolean {
		// Don't retry for certain error types
		const nonRetryableErrors = [
			LaunchError.EXECUTABLE_NOT_FOUND,
			LaunchError.ALREADY_RUNNING,
			LaunchError.PERMISSION_DENIED,
		];

		return !nonRetryableErrors.includes(error.errorType);
	}

	private calculateRetryDelay(): number {
		// Exponential backoff: 1s, 2s, 4s
		return Math.min(1000 * 2 ** (this.launchAttempts - 1), 4000);
	}

	private startTracking(): void {
		this.startTime = Date.now();
		this.isActive = true;
		this.updateStatus(LaunchStatus.RUNNING);
		this.emit("game:playing", this.id);

		if (this.achievementItem) {
			try {
				this.achievementItem.find();
				logger.log("info", `Achievement tracking started for ${this.gameName}`);
			} catch (error) {
				logger.log(
					"error",
					`Failed to start achievement tracking: ${(error as Error).message}`,
				);
			}
		}

		this.intervalId = setInterval(() => this.updateSessionTime(), ms("1m"));

		logger.log("info", `Started tracking ${this.gameName} (ID: ${this.id})`);
	}

	private updateSessionTime(): void {
		if (!this.isActive) return;
		const now = Date.now();
		const delta = now - this.startTime;
		this.startTime = now;
		this.totalPlaytimeMs += delta;
		logger.log(
			"debug",
			`Session +${ms(delta)}; total ${ms(this.totalPlaytimeMs)} for ${this.gameName}.`,
		);
	}

	private startProcessPolling(): void {
		if (this.processCheckIntervalId) {
			clearTimeout(this.processCheckIntervalId);
			this.processCheckIntervalId = null;
		}

		// For direct processes, start with longer intervals since we have exit events
		const pollingInterval = this.process ? ms("10s") : ms("3s");

		logger.log(
			"info",
			`Starting process polling for ${this.gameName} (interval: ${pollingInterval}ms)`,
		);

		this.scheduleNextPoll(pollingInterval);
	}

	/**
	 * Schedules the next polling check with adaptive interval
	 */
	private scheduleNextPoll(
		interval: number = this.getAdaptivePollingInterval(),
	): void {
		if (!this.isActive) return;

		this.processCheckIntervalId = setTimeout(async () => {
			this.processCheckIntervalId = null;

			if (!this.isActive) return;

			try {
				const isRunning = await this.isGameProcessRunning();

				if (!this.isActive) return; // Double-check after async operation

				if (!isRunning) {
					logger.log(
						"info",
						`Detected ${this.gameName} process has exited via polling`,
					);
					this.handleExit(0, null);
					return;
				}

				// Schedule next poll
				this.scheduleNextPoll();
			} catch (error) {
				logger.log(
					"warn",
					`Error during process polling: ${(error as Error).message}`,
				);
				this.scheduleNextPoll();
			}
		}, interval);
	}

	/**
	 * Gets an adaptive polling interval that increases based on consecutive failures
	 * and process stability to optimize performance.
	 */
	private getAdaptivePollingInterval(): number {
		if (!this.trackedProcessInfo) {
			return ms("3s"); // Default interval
		}

		const failureCount = this.trackedProcessInfo.pollingFailureCount;
		const runningTime = Date.now() - this.startTime;

		// Adaptive intervals based on failure count and stability
		if (failureCount === 0) {
			// Stable process - use longer intervals for better performance
			if (runningTime > ms("10m")) {
				return ms("10s"); // Very stable, poll less frequently
			}
			if (runningTime > ms("2m")) {
				return ms("5s"); // Moderately stable
			}
			return ms("3s"); // Recently started, poll more frequently
		}

		// Failure-based intervals
		if (failureCount <= 2) {
			return ms("5s"); // Slightly slower after first failures
		}
		if (failureCount <= 5) {
			return ms("10s"); // Slower polling for persistent failures
		}
		return ms("15s"); // Much slower for extended failures
	}

	private async isGameProcessRunning(): Promise<boolean> {
		if (!this.isActive) {
			return false;
		}

		if (!this.trackedProcessInfo) {
			return false;
		}

		if (this.process) {
			if (this.process.killed || this.process.exitCode !== null) {
				logger.log(
					"debug",
					`Direct process has exited: killed=${this.process.killed}, exitCode=${this.process.exitCode}`,
				);
				return false;
			}

			if (this.process.pid) {
				try {
					process.kill(this.process.pid, 0);
					logger.log(
						"debug",
						`Direct process PID ${this.process.pid} is still running`,
					);
					return true;
				} catch (error) {
					console.log(error);
					logger.log(
						"debug",
						`Direct process PID ${this.process.pid} no longer exists`,
					);
					return false;
				}
			}

			return true;
		}

		const processName = this.trackedProcessInfo.name;
		const processPid = this.trackedProcessInfo.pid;

		try {
			const processes = await findProcessByName(processName, false);

			if (processPid && processes.includes(processPid)) {
				this.trackedProcessInfo.pollingFailureCount = 0;
				return true;
			}

			if (processes.length > 0) {
				this.trackedProcessInfo.pid = processes[0];
				this.trackedProcessInfo.pollingFailureCount = 0;
				return true;
			}

			this.trackedProcessInfo.pollingFailureCount++;
			return false;
		} catch (error) {
			logger.log(
				"warn",
				`Error checking process status: ${(error as Error).message}`,
			);
			return false;
		}
	}

	private async handleExit(
		code: number | null,
		signal: NodeJS.Signals | null,
	): Promise<void> {
		const exitInfo = { code, signal, gameId: this.id, gameName: this.gameName };
		logger.log(
			"info",
			`Process exited: ${this.gameName} (code=${code}, signal=${signal})`,
		);

		if (!this.isActive) {
			logger.log("debug", "handleExit called but game not active. Skipping.");
			return;
		}

		this.isActive = false;
		this.updateStatus(LaunchStatus.STOPPING, exitInfo);

		this.clearAllTimeouts();

		try {
			this.updateSessionTime();

			await this.commitPlaytimeWithRetry();

			logger.log(
				"info",
				`Successfully committed playtime for ${this.gameName}: ${ms(this.totalPlaytimeMs)}`,
			);
		} catch (error) {
			logger.log(
				"error",
				`Failed to commit playtime after retries: ${(error as Error).message}`,
			);
		}

		this.cleanupResources();

		this.updateStatus(LaunchStatus.IDLE);
		this.emit("game:stopped", this.id);

		logger.log(
			"info",
			`Game session ended: ${this.gameName} (total playtime: ${ms(this.totalPlaytimeMs)})`,
		);
	}

	private clearAllTimeouts(): void {
		if (this.adminLaunchDetectionTimeout) {
			clearTimeout(this.adminLaunchDetectionTimeout);
			this.adminLaunchDetectionTimeout = null;
			logger.log("debug", "Cleared admin launch detection timeout");
		}

		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
			logger.log("debug", "Cleared playtime tracking interval");
		}

		if (this.processCheckIntervalId) {
			clearTimeout(this.processCheckIntervalId);
			this.processCheckIntervalId = null;
			logger.log("debug", "Cleared process polling timeout");
		}

		if (this.launchTimeoutId) {
			clearTimeout(this.launchTimeoutId);
			this.launchTimeoutId = null;
			logger.log("debug", "Cleared launch timeout");
		}
	}

	private async commitPlaytimeWithRetry(maxRetries = 3): Promise<void> {
		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				await this.commitPlaytime();
				return; // Success, exit retry loop
			} catch (error) {
				logger.log(
					"warn",
					`Playtime commit attempt ${attempt}/${maxRetries} failed: ${(error as Error).message}`,
				);

				if (attempt === maxRetries) {
					throw error; // Final attempt failed
				}

				// Wait before retry with exponential backoff
				const delay = Math.min(1000 * 2 ** (attempt - 1), 5000);
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
	}

	private async commitPlaytime(): Promise<void> {
		if (this.totalPlaytimeMs <= 0) {
			logger.log("debug", `No playtime to commit for ${this.gameName}`);
			return;
		}

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
				`Playtime committed for ${this.gameName}: ${ms(newPlaytime)} total (session: ${ms(this.totalPlaytimeMs)})`,
			);
		} catch (err) {
			const error = new LaunchOperationError(
				LaunchError.UNKNOWN,
				`Failed to save playtime for ${this.gameName}: ${(err as Error).message}`,
				{ gameId: this.id, playtime: this.totalPlaytimeMs, originalError: err },
			);
			throw error;
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
		// Clear all intervals and timeouts
		this.clearAllTimeouts();

		// Terminate process if still running
		if (this.process && !this.process.killed) {
			try {
				logger.log(
					"info",
					`cleanupResources: Attempting to terminate directly spawned process ${this.process.pid} for ${this.gameName}.`,
				);
				this.process.kill("SIGTERM");
			} catch (error) {
				logger.log(
					"warn",
					`cleanupResources: Failed to terminate process ${this.process.pid}: ${(error as Error).message}`,
				);
			}
		}

		// Clear references
		this.process = null;
		this.trackedProcessInfo = null;

		// Destroy achievement watcher
		if (this.achievementItem?.watcher_instance) {
			try {
				this.achievementItem.watcher_instance.destroy();
				logger.log(
					"debug",
					`cleanupResources: Destroyed achievement watcher for ${this.gameName}.`,
				);
			} catch (error) {
				logger.log(
					"warn",
					`cleanupResources: Failed to destroy achievement watcher: ${(error as Error).message}`,
				);
			}
		}

		// Remove from global tracking
		gamesLaunched.delete(this.id);
		logger.log(
			"info",
			`cleanupResources: Cleaned up resources for ${this.id}.`,
		);
	}

	/**
	 * Force stop the game process with enhanced error handling
	 */
	public async forceStop(): Promise<void> {
		if (!this.isActive) {
			logger.log("warn", `Game ${this.gameName} is not currently running`);
			return;
		}

		logger.log("info", `Force stopping ${this.gameName}...`);
		this.updateStatus(LaunchStatus.STOPPING, { forced: true });

		try {
			if (this.process?.pid) {
				// Try graceful termination first
				this.process.kill("SIGTERM");

				// Wait a bit for graceful shutdown
				await new Promise((resolve) => setTimeout(resolve, 2000));

				// Force kill if still running
				if (!this.process.killed) {
					this.process.kill("SIGKILL");
					logger.log("warn", `Force killed ${this.gameName} process`);
				}
			} else if (this.trackedProcessInfo?.pid) {
				// Handle tracked processes without direct control
				try {
					process.kill(this.trackedProcessInfo.pid, "SIGTERM");
					await new Promise((resolve) => setTimeout(resolve, 2000));

					// Check if still running and force kill
					const isStillRunning = await this.isGameProcessRunning();
					if (isStillRunning) {
						process.kill(this.trackedProcessInfo.pid, "SIGKILL");
						logger.log(
							"warn",
							`Force killed tracked process ${this.trackedProcessInfo.pid}`,
						);
					}
				} catch (killError) {
					logger.log(
						"warn",
						`Failed to kill tracked process: ${(killError as Error).message}`,
					);
				}
			}

			// Trigger cleanup
			await this.handleExit(0, null);
		} catch (error) {
			logger.log(
				"error",
				`Error during force stop: ${(error as Error).message}`,
			);
			// Ensure cleanup happens even if force stop fails
			this.isActive = false;
			this.cleanupResources();
			this.updateStatus(LaunchStatus.IDLE);
			this.emit("game:stopped", this.id);
		}
	}

	public async stop(): Promise<void> {
		logger.log(
			"info",
			`stop: Attempting to stop game ${this.id} (${this.gameName}).`,
		);
		if (!this.isActive) {
			logger.log(
				"debug",
				`stop: Game ${this.id} (${this.gameName}) is not active, no need to stop.`,
			);
			return;
		}

		if (this.process) {
			logger.log(
				"debug",
				`stop: Killing directly spawned process ${this.process.pid} for ${this.gameName}.`,
			);
			this.process.kill("SIGTERM");
		} else if (this.trackedProcessInfo?.pid) {
			const pid = this.trackedProcessInfo.pid;
			try {
				logger.log(
					"debug",
					`stop: Attempting to kill tracked PID ${pid} for ${this.gameName} via process.kill.`,
				);
				process.kill(pid, "SIGTERM");
				logger.log("info", `stop: Sent SIGTERM to PID ${pid}`);
			} catch (err) {
				logger.log(
					"warn",
					`stop: Could not kill process ${pid} for ${this.gameName}: ${(err as Error).message}. Forcing stop tracking.`,
				);
				this.handleExit(0, null);
			}
		} else {
			logger.log(
				"warn",
				`stop: Cannot directly kill elevated game ${this.id} as PID is unknown and no direct handle. Stopping tracking.`,
			);
			this.handleExit(0, null);
		}
	}

	public async isRunning(): Promise<boolean> {
		if (!this.isActive) {
			logger.log(
				"debug",
				`isRunning: Game ${this.id} is not active. Returning false.`,
			);
			return false;
		}
		if (!this.trackedProcessInfo) {
			logger.log(
				"debug",
				`isRunning: Game ${this.id} has no tracked info. Returning false.`,
			);
			return false;
		}

		const result = await this.isGameProcessRunning();
		logger.log(
			"debug",
			`isRunning: Check complete for ${this.gameName}. Result: ${result}.`,
		);
		return result;
	}

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
