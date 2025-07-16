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
	private estimatedTotalFiles = 0;
	private lastProgressUpdate = 0;

	constructor(
		private options: ScanOptions & { eventBatchInterval?: number } = {},
	) {
		super();
		this.eventBatchInterval = options.eventBatchInterval ?? 1000;
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
		// Emit batched stats if available
		if (this.batchedStats) {
			this.emit("statsUpdate", this.batchedStats);
			this.lastStatsEmit = Date.now();
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

		// Calculate progress estimation
		let estimatedTimeRemaining: number | undefined;
		let progressPercentage: number | undefined;

		if (this.estimatedTotalFiles > 0 && stats.processedFiles > 0) {
			progressPercentage = Math.min(
				(stats.processedFiles / this.estimatedTotalFiles) * 100,
				100,
			);

			// Calculate estimated time remaining based on current processing rate
			const processingRate = stats.processedFiles / (elapsedTime / 1000); // files per second
			if (processingRate > 0) {
				const remainingFiles = this.estimatedTotalFiles - stats.processedFiles;
				estimatedTimeRemaining = (remainingFiles / processingRate) * 1000; // in milliseconds
			}
		} else if (stats.processedFiles > 0 && elapsedTime > 5000) {
			// Fallback: estimate based on processing rate without total file count
			const processingRate = stats.processedFiles / (elapsedTime / 1000);
			if (processingRate > 0) {
				// Rough estimate: assume we're 10% done if we don't know total
				progressPercentage = Math.min(10, 100);
				estimatedTimeRemaining =
					((stats.processedFiles * 9) / processingRate) * 1000;
			}
		}

		this.batchedStats = {
			...stats,
			scanStartTime: this.scanStartTime,
			estimatedTotalFiles: this.estimatedTotalFiles || undefined,
			estimatedTimeRemaining,
			progressPercentage,
		};

		// For very frequent updates, emit immediately if it's been too long
		if (now - this.lastStatsEmit > this.eventBatchInterval * 2) {
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
		this.estimatedTotalFiles = 0; // Will be updated as we discover files
		this.lastProgressUpdate = startTime;

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
			this.startBatchTimer();

			// Scan each path
			for (const scanPath of scanPaths) {
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
							finalStats = stats;
							this.batchStats(stats);
						},
						// File found callback
						(fileInfo: FileInfo) => {
							finalStats.processedFiles++;

							// Check if the file is a game
							if (isGame(fileInfo, this.options)) {
								games.push(fileInfo);
								finalStats.gamesFound++;
								this.batchGame(fileInfo);
							}

							this.batchFile(fileInfo);
						},
					);

					this.emit("pathCompleted", { path: scanPath });
				} catch (error) {
					finalStats.errors++;
					this.emit("pathError", { path: scanPath, error });
				}
			}

			// Flush any remaining batched events
			this.flushBatchedEvents();

			const duration = Date.now() - startTime;
			const result: ScanResult = {
				games,
				stats: finalStats,
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
