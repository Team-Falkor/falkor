import EventEmitter from "node:events";
import type { FileInfo, ScanOptions, ScanResult, ScanStats } from "@/@types";
import { getCommonGameDirectories } from "./config/skipFolders";
import { isGame } from "./filters/gameFilter";
import { traverseFileSystem } from "./services/fileSystemService";
import { validateScanOptions } from "./utils/validation";

export class GameLocator extends EventEmitter {
	private isScanning = false;
	private abortController: AbortController | null = null;
	private eventBatchInterval = 1000; // 1 second batching interval
	private batchedStats: ScanStats | null = null;
	private batchedGames: FileInfo[] = [];
	private batchedFiles: FileInfo[] = [];
	private batchTimer: NodeJS.Timeout | null = null;
	private lastStatsEmit = 0;
	// Progress estimation fields
	private scanStartTime = 0;

	constructor(
		private options: ScanOptions & { eventBatchInterval?: number } = {},
	) {
		super();
		this.eventBatchInterval = options.eventBatchInterval ?? 500; // Reduced from 1000ms to 500ms
	}

	/**
	 * Start the batch timer for event emission
	 */
	private startBatchTimer(): void {
		if (this.batchTimer) return;

		this.batchTimer = setInterval(() => {
			this.flushBatchedEvents();
		}, this.eventBatchInterval);
	}

	/**
	 * Stop the batch timer
	 */
	private stopBatchTimer(): void {
		if (this.batchTimer) {
			clearInterval(this.batchTimer);
			this.batchTimer = null;
		}
	}

	/**
	 * Flush all batched events immediately
	 */
	private flushBatchedEvents(): void {
		// Always emit batched stats if available to ensure UI updates
		if (this.batchedStats) {
			this.emit("statsUpdate", this.batchedStats);
			this.lastStatsEmit = Date.now();
			// Clear batched stats after emission to prevent duplicate emissions
			this.batchedStats = null;
		}

		// Emit batched games
		for (const game of this.batchedGames) {
			this.emit("gameFound", game);
		}

		// Emit batched files (only emit a subset to avoid overwhelming the UI)
		const maxFilesToEmit = 50; // Limit file events to prevent UI overload
		const filesToEmit = this.batchedFiles.slice(-maxFilesToEmit); // Get the most recent files
		for (const file of filesToEmit) {
			this.emit("fileProcessed", file);
		}

		// Clear batched arrays
		this.batchedGames.length = 0;
		this.batchedFiles.length = 0;
	}

	/**
	 * Add stats to batch with progress estimation
	 */
	private batchStats(stats: ScanStats): void {
		const now = Date.now();
		const elapsedTime = now - this.scanStartTime;

		// Calculate progress estimation based on directory traversal
		let estimatedTimeRemaining: number | undefined;
		let progressPercentage: number | undefined;

		// Use a more realistic progress estimation based on directories processed
		// and the typical file system structure
		if (stats.processedDirs > 0 && elapsedTime > 2000) {
			// Estimate progress based on directory processing rate
			const dirProcessingRate = stats.processedDirs / (elapsedTime / 1000);

			// Use a logarithmic approach for progress estimation
			// Most file systems have exponential depth distribution
			const logProgress =
				Math.log10(stats.processedDirs + 1) / Math.log10(1000); // Assume ~1000 dirs max
			progressPercentage = Math.min(logProgress * 100, 95); // Cap at 95% until completion

			// Estimate time remaining based on current processing rate with diminishing returns
			if (dirProcessingRate > 0 && progressPercentage < 90) {
				// Use exponential decay for time estimation as we progress
				const remainingProgress = (100 - progressPercentage) / 100;
				const estimatedRemainingDirs = Math.max(
					10,
					stats.processedDirs * remainingProgress,
				);
				estimatedTimeRemaining =
					(estimatedRemainingDirs / dirProcessingRate) * 1000;

				// Apply a smoothing factor to reduce wild fluctuations
				if (this.batchedStats?.estimatedTimeRemaining) {
					estimatedTimeRemaining =
						this.batchedStats.estimatedTimeRemaining * 0.7 +
						estimatedTimeRemaining * 0.3;
				}
			}
		} else if (elapsedTime > 1000) {
			// Early stage estimation
			progressPercentage = Math.min((elapsedTime / 10000) * 100, 15); // Very conservative early estimate
		}

		this.batchedStats = {
			...stats,
			scanStartTime: this.scanStartTime,
			estimatedTimeRemaining,
			progressPercentage,
		};

		// Emit stats updates more frequently to ensure UI responsiveness
		// Emit immediately if it's been more than 500ms since last emit or if this is the first stats update
		if (now - this.lastStatsEmit > 500 || this.lastStatsEmit === 0) {
			this.emit("statsUpdate", this.batchedStats);
			this.lastStatsEmit = now;
		}
	}

	/**
	 * Add game to batch
	 */
	private batchGame(game: FileInfo): void {
		this.batchedGames.push(game);
		// Games will be emitted when the batch timer fires or when flushed
	}

	/**
	 * Add file to batch (optional detailed monitoring)
	 */
	private batchFile(file: FileInfo): void {
		this.batchedFiles.push(file);
		// Files will be emitted when the batch timer fires or when flushed
	}

	/**
	 * Start scanning for games in the specified paths or common game directories
	 * @param paths - Array of paths to scan. If empty, scans common game directories
	 * @returns Promise that resolves with scan results
	 */
	async scan(paths: string[] = []): Promise<ScanResult> {
		if (this.isScanning) {
			throw new Error("Scan already in progress");
		}

		// Validate scan options
		const validation = validateScanOptions(this.options);
		if (!validation.isValid) {
			throw new Error(`Invalid scan options: ${validation.errors.join(", ")}`);
		}

		this.isScanning = true;
		this.abortController = new AbortController();

		const startTime = Date.now();
		this.scanStartTime = startTime;

		const games: FileInfo[] = [];
		let finalStats: ScanStats = {
			processedDirs: 0,
			processedFiles: 0,
			skippedPaths: 0,
			errors: 0,
			gamesFound: 0,
			scanStartTime: this.scanStartTime,
		};

		try {
			// Use provided paths or default to common game directories
			const scanPaths = paths.length > 0 ? paths : getCommonGameDirectories();

			this.emit("scanStarted", { paths: scanPaths, options: this.options });
			
			// Emit initial stats to ensure UI gets baseline data
			this.emit("statsUpdate", finalStats);
			
			this.startBatchTimer();

			// Scan each path
			for (const scanPath of scanPaths) {
				// Check for abort signal before starting each path
				if (this.abortController?.signal.aborted) {
					break;
				}

				this.emit("pathStarted", { path: scanPath });

				try {
						await traverseFileSystem(
							scanPath,
							this.options,
							// Stats update callback
							(stats: ScanStats) => {
								// Update finalStats with current stats and games found
								finalStats = {
									...stats,
									gamesFound: games.length,
								};
								this.batchStats(finalStats);
							},
							// File found callback
							(fileInfo: FileInfo) => {
								// Check if the file is a game
								if (isGame(fileInfo, this.options)) {
									games.push(fileInfo);
									this.batchGame(fileInfo);
								}

								this.batchFile(fileInfo);
							},
							// Abort signal
							this.abortController?.signal,
						);

					this.emit("pathCompleted", { path: scanPath });
				} catch (error) {
					finalStats.errors++;
					this.emit("pathError", { path: scanPath, error });
				}
			}

			// Flush any remaining batched events
			this.flushBatchedEvents();

			// Ensure final stats include all discovered games
			finalStats.gamesFound = games.length;

			// Emit final stats with completion
			const completionStats = {
				...finalStats,
				progressPercentage: 100,
				estimatedTimeRemaining: 0,
			};
			this.emit("statsUpdate", completionStats);

			const duration = Date.now() - startTime;
			const result: ScanResult = {
				games,
				stats: completionStats,
				duration,
				success: !this.abortController?.signal.aborted,
			};

			this.emit("scanCompleted", result);
			return result;
		} catch (error) {
			const duration = Date.now() - startTime;
			const result: ScanResult = {
				games,
				stats: finalStats,
				duration,
				success: false,
			};

			this.emit("scanError", { error, result });
			throw error;
		} finally {
			this.stopBatchTimer();
			this.flushBatchedEvents(); // Final flush
			this.isScanning = false;
			this.abortController = null;
		}
	}

	/**
	 * Stop the current scan operation
	 */
	stop(): void {
		if (this.isScanning && this.abortController) {
			this.abortController.abort();
			this.stopBatchTimer();
			this.flushBatchedEvents(); // Flush any pending events
			
			// Reset scanning state immediately
			this.isScanning = false;
			this.abortController = null;
			
			this.emit("scanStopped");
		}
	}

	/**
	 * Check if a scan is currently in progress
	 */
	get scanning(): boolean {
		return this.isScanning;
	}

	/**
	 * Update scan options
	 */
	updateOptions(
		newOptions: Partial<ScanOptions & { eventBatchInterval?: number }>,
	): void {
		if (this.isScanning) {
			throw new Error("Cannot update options while scanning");
		}
		if (
			"eventBatchInterval" in newOptions &&
			newOptions.eventBatchInterval !== undefined
		) {
			this.eventBatchInterval = newOptions.eventBatchInterval;
			// Restart batch timer with new interval if scanning
			if (this.isScanning) {
				this.stopBatchTimer();
				this.startBatchTimer();
			}
		}
		this.options = { ...this.options, ...newOptions };
		this.emit("optionsUpdated", this.options);
	}

	/**
	 * Get current scan options
	 */
	getOptions(): ScanOptions {
		return { ...this.options };
	}

	/**
	 * Get common game directories for the current platform
	 */
	static getCommonGameDirectories(): string[] {
		return getCommonGameDirectories();
	}
}
