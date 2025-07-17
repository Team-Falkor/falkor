import { publicProcedure, router } from "@backend/api/trpc";
import { GameLocator } from "@backend/handlers/game-locator";
import { observable } from "@trpc/server/observable";
import { z } from "zod";
import type { FileInfo, ScanOptions, ScanResult, ScanStats } from "@/@types";

/**
 * Validation schemas
 */
const scanOptionsSchema = z.object({
	extraSkipFolders: z.array(z.string()).optional(),
	minFileSize: z.number().int().positive().optional(),
	maxFileSize: z.number().int().positive().optional(),
	maxDepth: z.number().int().positive().optional(),
	timeout: z.number().int().positive().optional(),
	concurrency: z.number().int().positive().optional(),
	eventBatchInterval: z.number().int().positive().optional(),
});

const scanInputSchema = z.object({
	paths: z.array(z.string()).optional().default([]),
	options: scanOptionsSchema.optional().default({}),
});

const updateOptionsSchema = z.object({
	options: scanOptionsSchema,
});

// Global GameLocator instance
let gameLocatorInstance: GameLocator | null = null;

/**
 * Get or create GameLocator instance
 */
function getGameLocatorInstance(options: ScanOptions = {}) {
	if (!gameLocatorInstance) {
		gameLocatorInstance = new GameLocator(options);
	}
	return gameLocatorInstance;
}

export const gameLocatorRouter = router({
	/**
	 * Start scanning for games
	 */
	scan: publicProcedure.input(scanInputSchema).mutation(async ({ input }) => {
		const locator = getGameLocatorInstance(input.options);

		try {
			const result = await locator.scan(input.paths);
			return {
				success: true,
				data: result,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Unknown error occurred",
			};
		}
	}),

	/**
	 * Stop the current scan
	 */
	stop: publicProcedure.mutation(async () => {
		if (gameLocatorInstance) {
			gameLocatorInstance.stop();
			return { success: true, message: "Scan stopped" };
		}
		return { success: false, message: "No active scan to stop" };
	}),

	/**
	 * Check if scanning is in progress
	 */
	isScanning: publicProcedure.query(async () => {
		const isScanning = gameLocatorInstance?.scanning ?? false;
		return { isScanning };
	}),

	/**
	 * Update scan options
	 */
	updateOptions: publicProcedure
		.input(updateOptionsSchema)
		.mutation(async ({ input }) => {
			try {
				const locator = getGameLocatorInstance();
				locator.updateOptions(input.options);
				return {
					success: true,
					message: "Options updated successfully",
					options: locator.getOptions(),
				};
			} catch (error) {
				return {
					success: false,
					error:
						error instanceof Error ? error.message : "Failed to update options",
				};
			}
		}),

	/**
	 * Get current scan options
	 */
	getOptions: publicProcedure.query(async () => {
		const options = gameLocatorInstance?.getOptions() ?? {};
		return { options };
	}),

	/**
	 * Get common game directories for the current platform
	 */
	getCommonGameDirectories: publicProcedure.query(async () => {
		const directories = GameLocator.getCommonGameDirectories();
		return { directories };
	}),

	/**
	 * Create a new GameLocator instance with specific options
	 */
	createInstance: publicProcedure
		.input(scanOptionsSchema)
		.mutation(async ({ input }) => {
			gameLocatorInstance = new GameLocator(input);
			return {
				success: true,
				message: "GameLocator instance created",
				options: gameLocatorInstance.getOptions(),
			};
		}),

	/**
	 * Reset the GameLocator instance
	 */
	resetInstance: publicProcedure.mutation(async () => {
		if (gameLocatorInstance?.scanning) {
			gameLocatorInstance.stop();
		}
		gameLocatorInstance = null;
		return {
			success: true,
			message: "GameLocator instance reset",
		};
	}),

	/**
	 * Subscribe to scan progress events
	 */
	scanProgress: publicProcedure.subscription(() => {
		return observable<{
			type:
				| "scanStarted"
				| "statsUpdate"
				| "gameFound"
				| "pathStarted"
				| "pathCompleted"
				| "scanCompleted"
				| "scanError"
				| "scanStopped"
				| "fileProcessed";
			data:
				| ScanStats
				| FileInfo
				| ScanResult
				| { path: string }
				| { error: string }
				| { paths: string[]; options: ScanOptions }
				| Record<string, never>;
			timestamp: number;
		}>((emit) => {
			const locator = getGameLocatorInstance();

			// Event listeners for real-time updates
			const onScanStarted = (data: {
				paths: string[];
				options: ScanOptions;
			}) => {
				emit.next({
					type: "scanStarted",
					data,
					timestamp: Date.now(),
				});
			};

			const onStatsUpdate = (data: ScanStats) => {
				emit.next({
					type: "statsUpdate",
					data,
					timestamp: Date.now(),
				});
			};

			const onGameFound = (data: FileInfo) => {
				emit.next({
					type: "gameFound",
					data,
					timestamp: Date.now(),
				});
			};

			const onPathStarted = (data: { path: string }) => {
				emit.next({
					type: "pathStarted",
					data,
					timestamp: Date.now(),
				});
			};

			const onPathCompleted = (data: { path: string }) => {
				emit.next({
					type: "pathCompleted",
					data,
					timestamp: Date.now(),
				});
			};

			const onScanCompleted = (data: ScanResult) => {
				emit.next({
					type: "scanCompleted",
					data,
					timestamp: Date.now(),
				});
			};

			const onScanError = (data: { error: string }) => {
				emit.next({
					type: "scanError",
					data,
					timestamp: Date.now(),
				});
			};

			const onScanStopped = () => {
				emit.next({
					type: "scanStopped",
					data: {},
					timestamp: Date.now(),
				});
			};

			const onFileProcessed = (data: FileInfo) => {
				emit.next({
					type: "fileProcessed",
					data,
					timestamp: Date.now(),
				});
			};

			// Register event listeners
			locator.on("scanStarted", onScanStarted);
			locator.on("statsUpdate", onStatsUpdate);
			locator.on("gameFound", onGameFound);
			locator.on("pathStarted", onPathStarted);
			locator.on("pathCompleted", onPathCompleted);
			locator.on("scanCompleted", onScanCompleted);
			locator.on("scanError", onScanError);
			locator.on("scanStopped", onScanStopped);
			locator.on("fileProcessed", onFileProcessed);

			// Cleanup function
			return () => {
				locator.off("scanStarted", onScanStarted);
				locator.off("statsUpdate", onStatsUpdate);
				locator.off("gameFound", onGameFound);
				locator.off("pathStarted", onPathStarted);
				locator.off("pathCompleted", onPathCompleted);
				locator.off("scanCompleted", onScanCompleted);
				locator.off("scanError", onScanError);
				locator.off("scanStopped", onScanStopped);
				locator.off("fileProcessed", onFileProcessed);
			};
		});
	}),

	/**
	 * Subscribe to game discovery events only
	 */
	gameDiscovery: publicProcedure.subscription(() => {
		return observable<{
			game: FileInfo;
			totalFound: number;
			timestamp: number;
		}>((emit) => {
			const locator = getGameLocatorInstance();
			let totalFound = 0;

			const onGameFound = (game: FileInfo) => {
				totalFound++;
				emit.next({
					game,
					totalFound,
					timestamp: Date.now(),
				});
			};

			const onScanStarted = () => {
				totalFound = 0;
			};

			locator.on("gameFound", onGameFound);
			locator.on("scanStarted", onScanStarted);

			return () => {
				locator.off("gameFound", onGameFound);
				locator.off("scanStarted", onScanStarted);
			};
		});
	}),

	/**
	 * Subscribe to scan statistics only
	 */
	scanStats: publicProcedure.subscription(() => {
		return observable<{
			stats: ScanStats;
			timestamp: number;
		}>((emit) => {
			const locator = getGameLocatorInstance();

			const onStatsUpdate = (stats: ScanStats) => {
				emit.next({
					stats,
					timestamp: Date.now(),
				});
			};

			locator.on("statsUpdate", onStatsUpdate);

			return () => {
				locator.off("statsUpdate", onStatsUpdate);
			};
		});
	}),
});
