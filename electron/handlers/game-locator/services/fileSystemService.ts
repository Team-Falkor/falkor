import type { Dirent, Stats } from "node:fs";
import * as fs from "node:fs/promises";
import { cpus } from "node:os";
import * as path from "node:path";
import type { FileInfo, ScanOptions, ScanStats } from "@/@types";
import { shouldSkipPath } from "../config/skipFolders";
import { normalizePath } from "../utils/pathUtils";

const MAX_CONCURRENT_OPERATIONS = cpus().length;
const BATCH_SIZE = 100;

const readDirectorySafely = async (
	directoryPath: string,
): Promise<Dirent[]> => {
	try {
		return await fs.readdir(directoryPath, { withFileTypes: true });
	} catch (error) {
		if (
			error &&
			typeof error === "object" &&
			"code" in error &&
			["EACCES", "ENOENT", "EPERM"].includes((error as { code: string }).code)
		) {
			return [];
		}
		throw error;
	}
};

const getFileStatsSafely = async (filePath: string): Promise<Stats | null> => {
	try {
		return await fs.stat(filePath);
	} catch (error: unknown) {
		if (
			error &&
			typeof error === "object" &&
			"code" in error &&
			["EACCES", "ENOENT", "EPERM"].includes((error as { code: string }).code)
		) {
			return null;
		}
		throw error;
	}
};

type StatsCallback = (stats: ScanStats) => void;
type FileFoundCallback = (fileInfo: FileInfo) => void;

export const traverseFileSystem = async (
	rootPath: string,
	options: ScanOptions = {},
	onStatsUpdate?: StatsCallback,
	onFileFound?: FileFoundCallback,
	abortSignal?: AbortSignal,
): Promise<void> => {
	const stats: ScanStats = {
		processedDirs: 0,
		processedFiles: 0,
		skippedPaths: 0,
		errors: 0,
		gamesFound: 0,
	};

	const { maxDepth = 10, concurrency = MAX_CONCURRENT_OPERATIONS } = options;
	const directoriesToExplore: Array<{ path: string; depth: number }> = [];
	const semaphore = new Semaphore(concurrency);

	const initialNormalizedRootPath = normalizePath(rootPath);

	if (shouldSkipPath(initialNormalizedRootPath, options.extraSkipFolders)) {
		stats.skippedPaths++;
		return;
	}

	directoriesToExplore.push({ path: initialNormalizedRootPath, depth: 0 });

	const processBatch = async (
		batch: Array<{ path: string; depth: number }>,
	) => {
		const promises = batch.map(async ({ path: currentPath, depth }) => {
			if (depth > maxDepth) {
				return;
			}

			return semaphore.acquire(async () => {
				// Check for abort signal before processing
				if (abortSignal?.aborted) {
					return;
				}
				
				try {
					stats.processedDirs++;
					onStatsUpdate?.(stats);

					const dirents = await readDirectorySafely(currentPath);
					const fileBatch: string[] = [];
					const newDirs: Array<{ path: string; depth: number }> = [];

					for (const dirent of dirents) {
						const fullPath = path.join(currentPath, dirent.name);
						const normalizedFullPath = normalizePath(fullPath);

						if (shouldSkipPath(normalizedFullPath, options.extraSkipFolders)) {
							stats.skippedPaths++;
							continue;
						}

						if (dirent.isDirectory()) {
							newDirs.push({ path: normalizedFullPath, depth: depth + 1 });
						} else {
							fileBatch.push(normalizedFullPath);
						}
					}

					// Process files in parallel
					await Promise.all(
						fileBatch.map(async (filePath) => {
							// Check abort signal before processing each file
							if (abortSignal?.aborted) {
								return;
							}
							
							try {
								const fileStats = await getFileStatsSafely(filePath);
								if (fileStats) {
									stats.processedFiles++;
									const fileInfo: FileInfo = {
										name: path.basename(filePath),
										path: filePath,
										isDirectory: false,
										size: fileStats.size,
										lastModified: fileStats.mtime,
									};
									onFileFound?.(fileInfo);
								}
							} catch {
								stats.errors++;
							}
						}),
					);

					// Add new directories to explore
					directoriesToExplore.push(...newDirs);
				} catch {
					stats.errors++;
				}
			});
		});

		await Promise.all(promises);
	};

	// Process directories in batches
	while (directoriesToExplore.length > 0) {
		// Check for abort signal
		if (abortSignal?.aborted) {
			break;
		}
		
		const batch = directoriesToExplore.splice(0, BATCH_SIZE);
		await processBatch(batch);
	}
};

// Simple semaphore implementation for concurrency control
class Semaphore {
	private permits: number;
	private queue: Array<() => void> = [];

	constructor(permits: number) {
		this.permits = permits;
	}

	async acquire<T>(fn: () => Promise<T>): Promise<T> {
		return new Promise((resolve, reject) => {
			const execute = async () => {
				try {
					const result = await fn();
					this.release();
					resolve(result);
				} catch (error) {
					this.release();
					reject(error);
				}
			};

			if (this.permits > 0) {
				this.permits--;
				execute();
			} else {
				this.queue.push(() => {
					this.permits--;
					execute();
				});
			}
		});
	}

	private release(): void {
		this.permits++;
		if (this.queue.length > 0) {
			const next = this.queue.shift();
			next?.();
		}
	}
}
