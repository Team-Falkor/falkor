import EventEmitter from "node:events";
import type { FileInfo, ScanOptions, ScanResult, ScanStats } from "@/@types";
import { getCommonGameDirectories } from "./config/skipFolders";
import { isGame } from "./filters/gameFilter";
import { traverseFileSystem } from "./services/fileSystemService";
import { validateScanOptions } from "./utils/validation";

export class GameLocator extends EventEmitter {
	private isScanning = false;
	private abortController: AbortController | null = null;

	constructor(private options: ScanOptions) {
		super();
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
		const games: FileInfo[] = [];
		let finalStats: ScanStats = {
			processedDirs: 0,
			processedFiles: 0,
			skippedPaths: 0,
			errors: 0,
			gamesFound: 0,
		};

		try {
			// Use provided paths or default to common game directories
			const scanPaths = paths.length > 0 ? paths : getCommonGameDirectories();

			this.emit("scanStarted", { paths: scanPaths, options: this.options });

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
							this.emit("statsUpdate", stats);
						},
						// File found callback
						(fileInfo: FileInfo) => {
							finalStats.processedFiles++;

							// Check if the file is a game
							if (isGame(fileInfo, this.options)) {
								games.push(fileInfo);
								finalStats.gamesFound++;
								this.emit("gameFound", fileInfo);
							}

							this.emit("fileProcessed", fileInfo);
						},
					);

					this.emit("pathCompleted", { path: scanPath });
				} catch (error) {
					finalStats.errors++;
					this.emit("pathError", { path: scanPath, error });
				}
			}

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
	updateOptions(newOptions: Partial<ScanOptions>): void {
		if (this.isScanning) {
			throw new Error("Cannot update options while scanning");
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
