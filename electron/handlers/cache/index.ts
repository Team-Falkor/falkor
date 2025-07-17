import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { gunzip, gzip } from "node:zlib";
import { constants } from "../../utils/constants";
import {
	getNetworkStatus,
	startNetworkMonitoring,
	stopNetworkMonitoring,
} from "../../utils/network";

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

interface CacheEntry<T = unknown> {
	data: T;
	expiresAt: number;
}

interface ImageCacheEntry {
	filePath: string;
	mimeType: string;
	size: number;
	expiresAt: number;
	cachedAt: number;
}

interface CacheOptions {
	ttl?: number;
}

interface ImageCacheOptions {
	ttl?: number;
	mimeType?: string;
}

interface CacheStore {
	[key: string]: CacheEntry<unknown>;
}

interface ImageCacheStore {
	[key: string]: ImageCacheEntry;
}

class CacheManager {
	private cacheFilePath: string;
	private imageCacheDir: string;
	private cache: CacheStore = {};
	private imageCache: ImageCacheStore = {};
	private isDirty = false;
	private isImageCacheDirty = false;
	private cleanupInterval?: NodeJS.Timeout;
	private saveInterval?: NodeJS.Timeout;

	constructor() {
		this.cacheFilePath = path.join(constants.cachePath, "cache.json.gz");
		this.imageCacheDir = path.join(constants.cachePath, "images");
		this.ensureCacheDirectory();
		this.loadCache();
		this.initializeNetworkMonitoring();
		this.startCleanupInterval();
		this.startSaveInterval();
	}

	private ensureCacheDirectory(): void {
		if (!fs.existsSync(constants.cachePath)) {
			fs.mkdirSync(constants.cachePath, { recursive: true });
		}
		if (!fs.existsSync(this.imageCacheDir)) {
			fs.mkdirSync(this.imageCacheDir, { recursive: true });
		}
	}

	private async loadCache(): Promise<void> {
		try {
			if (fs.existsSync(this.cacheFilePath)) {
				const compressedData = await fs.promises.readFile(this.cacheFilePath);
				const decompressedData = await gunzipAsync(compressedData);
				const fileContent = decompressedData.toString("utf-8");
				const cacheData = JSON.parse(fileContent);

				// Load regular cache and image cache metadata
				this.cache = cacheData.cache || cacheData; // Backward compatibility
				this.imageCache = cacheData.imageCache || {};

				this.cleanupExpiredEntries();
				await this.cleanupExpiredImages();
			} else {
				const legacyCacheFile = path.join(constants.cachePath, "cache.json");
				if (fs.existsSync(legacyCacheFile)) {
					console.log("Migrating legacy cache file to compressed format...");
					const fileContent = await fs.promises.readFile(
						legacyCacheFile,
						"utf-8",
					);
					this.cache = JSON.parse(fileContent);
					this.imageCache = {};
					this.isDirty = true;
					await this.saveCache();
					await fs.promises.unlink(legacyCacheFile);
					console.log("Cache migration completed successfully");
					this.cleanupExpiredEntries();
				}
			}
		} catch (error) {
			console.error("Failed to load cache:", error);
			this.cache = {};
			this.imageCache = {};
		}
	}

	private async saveCache(): Promise<void> {
		if (!this.isDirty && !this.isImageCacheDirty) return;

		try {
			const cacheData = {
				cache: this.cache,
				imageCache: this.imageCache,
			};
			const jsonData = JSON.stringify(cacheData);
			const compressedData = await gzipAsync(Buffer.from(jsonData, "utf-8"));
			const tempPath = `${this.cacheFilePath}.tmp`;
			await fs.promises.writeFile(tempPath, compressedData);
			await fs.promises.rename(tempPath, this.cacheFilePath);
			this.isDirty = false;
			this.isImageCacheDirty = false;
		} catch (error) {
			console.error("Failed to save cache:", error);
		}
	}

	private cleanupExpiredEntries(): void {
		if (!getNetworkStatus()) return;

		const now = Date.now();
		let hasExpired = false;

		for (const [key, entry] of Object.entries(this.cache)) {
			if (now > entry.expiresAt) {
				delete this.cache[key];
				hasExpired = true;
			}
		}

		if (hasExpired) {
			this.isDirty = true;
		}
	}

	private async cleanupExpiredImages(): Promise<void> {
		if (!getNetworkStatus()) return;

		const now = Date.now();
		let hasExpired = false;

		for (const [key, entry] of Object.entries(this.imageCache)) {
			if (now > entry.expiresAt) {
				try {
					if (fs.existsSync(entry.filePath)) {
						await fs.promises.unlink(entry.filePath);
					}
				} catch (error) {
					console.error(
						`Failed to delete expired image file: ${entry.filePath}`,
						error,
					);
				}
				delete this.imageCache[key];
				hasExpired = true;
			}
		}

		if (hasExpired) {
			this.isImageCacheDirty = true;
		}
	}

	private isExpired(entry: CacheEntry): boolean {
		return Date.now() > entry.expiresAt;
	}

	private isImageExpired(entry: ImageCacheEntry): boolean {
		return Date.now() > entry.expiresAt;
	}

	private generateImageFileName(key: string, mimeType?: string): string {
		const hash = crypto.createHash("sha256").update(key).digest("hex");
		const extension = this.getExtensionFromMimeType(mimeType);
		return `${hash}${extension}`;
	}

	private getExtensionFromMimeType(mimeType?: string): string {
		if (!mimeType) return ".bin";
		const extensions: Record<string, string> = {
			"image/jpeg": ".jpg",
			"image/jpg": ".jpg",
			"image/png": ".png",
			"image/gif": ".gif",
			"image/webp": ".webp",
			"image/svg+xml": ".svg",
			"image/bmp": ".bmp",
			"image/tiff": ".tiff",
			"image/ico": ".ico",
		};
		return extensions[mimeType.toLowerCase()] || ".bin";
	}

	async set<T>(
		key: string,
		data: T,
		options: CacheOptions = {},
	): Promise<void> {
		const ttl = options.ttl ?? 24 * 60 * 60 * 1000;
		const expiresAt = Date.now() + ttl;

		this.cache[key] = {
			data,
			expiresAt,
		};

		this.isDirty = true;
		await this.saveCache();
	}

	async get<T = unknown>(key: string): Promise<T | null> {
		const entry = this.cache[key];

		if (!entry) {
			return null;
		}

		if (this.isExpired(entry)) {
			if (!getNetworkStatus()) {
				console.log(
					`Cache: Serving expired data for key '${key}' due to offline status`,
				);
				return entry.data as T;
			}

			delete this.cache[key];
			this.isDirty = true;
			await this.saveCache();
			return null;
		}

		return entry.data as T;
	}

	async setImage(
		key: string,
		imageData: Buffer,
		options: ImageCacheOptions = {},
	): Promise<void> {
		const ttl = options.ttl ?? 7 * 24 * 60 * 60 * 1000; // Default 7 days
		const expiresAt = Date.now() + ttl;
		const fileName = this.generateImageFileName(key, options.mimeType);
		const filePath = path.join(this.imageCacheDir, fileName);

		try {
			// Delete existing image if it exists
			if (this.imageCache[key]) {
				await this.deleteImage(key);
			}

			// Write image file
			await fs.promises.writeFile(filePath, imageData);

			// Update metadata
			this.imageCache[key] = {
				filePath,
				mimeType: options.mimeType || "application/octet-stream",
				size: imageData.length,
				expiresAt,
				cachedAt: Date.now(),
			};

			this.isImageCacheDirty = true;
			await this.saveCache();
		} catch (error) {
			console.error(`Failed to cache image for key '${key}':`, error);
			throw error;
		}
	}

	async getImage(key: string): Promise<Buffer | null> {
		const entry = this.imageCache[key];

		if (!entry) {
			return null;
		}

		if (this.isImageExpired(entry)) {
			if (!getNetworkStatus()) {
				console.log(
					`Image Cache: Serving expired image for key '${key}' due to offline status`,
				);
				try {
					if (fs.existsSync(entry.filePath)) {
						return await fs.promises.readFile(entry.filePath);
					}
				} catch (error) {
					console.error(
						`Failed to read expired image file: ${entry.filePath}`,
						error,
					);
				}
				return null;
			}

			// Online: delete expired image
			await this.deleteImage(key);
			return null;
		}

		try {
			if (fs.existsSync(entry.filePath)) {
				return await fs.promises.readFile(entry.filePath);
			}
			// File missing, clean up metadata
			delete this.imageCache[key];
			this.isImageCacheDirty = true;
			await this.saveCache();
			return null;
		} catch (error) {
			console.error(`Failed to read image file: ${entry.filePath}`, error);
			return null;
		}
	}

	async deleteImage(key: string): Promise<void> {
		const entry = this.imageCache[key];
		if (!entry) return;

		try {
			if (fs.existsSync(entry.filePath)) {
				await fs.promises.unlink(entry.filePath);
			}
		} catch (error) {
			console.error(`Failed to delete image file: ${entry.filePath}`, error);
		}

		delete this.imageCache[key];
		this.isImageCacheDirty = true;
		await this.saveCache();
	}

	async hasImage(key: string): Promise<boolean> {
		const entry = this.imageCache[key];
		if (!entry) return false;

		// Check if expired (but allow offline access)
		if (this.isImageExpired(entry) && getNetworkStatus()) {
			await this.deleteImage(key);
			return false;
		}

		// Check if file exists
		return fs.existsSync(entry.filePath);
	}

	async delete(key: string): Promise<void> {
		if (this.cache[key]) {
			delete this.cache[key];
			this.isDirty = true;
			await this.saveCache();
		}
	}

	async has(key: string): Promise<boolean> {
		const data = await this.get(key);
		return data !== null;
	}

	async clear(): Promise<void> {
		this.cache = {};
		this.isDirty = true;
		await this.clearImages();
		await this.saveCache();
	}

	async clearImages(): Promise<void> {
		// Delete all image files
		for (const entry of Object.values(this.imageCache)) {
			try {
				if (fs.existsSync(entry.filePath)) {
					await fs.promises.unlink(entry.filePath);
				}
			} catch (error) {
				console.error(`Failed to delete image file: ${entry.filePath}`, error);
			}
		}

		this.imageCache = {};
		this.isImageCacheDirty = true;
	}

	async getStats(): Promise<{
		totalEntries: number;
		expiredEntries: number;
		expiredButPreserved: number;
		isOnline: boolean;
		imageStats: {
			totalImages: number;
			expiredImages: number;
			expiredButPreserved: number;
			totalSize: number;
		};
		compressionStats?: {
			uncompressedSize: number;
			compressedSize: number;
			compressionRatio: number;
		};
	}> {
		const now = Date.now();
		let expiredEntries = 0;
		const totalEntries = Object.keys(this.cache).length;

		for (const entry of Object.values(this.cache)) {
			if (now > entry.expiresAt) {
				expiredEntries++;
			}
		}

		// Calculate image stats
		let expiredImages = 0;
		let totalImageSize = 0;
		const totalImages = Object.keys(this.imageCache).length;

		for (const entry of Object.values(this.imageCache)) {
			if (now > entry.expiresAt) {
				expiredImages++;
			}
			totalImageSize += entry.size;
		}

		const isOnline = getNetworkStatus();
		const expiredButPreserved = isOnline ? 0 : expiredEntries;
		const expiredImagesButPreserved = isOnline ? 0 : expiredImages;

		let compressionStats:
			| {
					uncompressedSize: number;
					compressedSize: number;
					compressionRatio: number;
			  }
			| undefined;

		try {
			if (fs.existsSync(this.cacheFilePath)) {
				const jsonData = JSON.stringify(this.cache);
				const uncompressedSize = Buffer.byteLength(jsonData, "utf-8");
				const compressedData = await fs.promises.readFile(this.cacheFilePath);
				const compressedSize = compressedData.length;
				const compressionRatio =
					uncompressedSize > 0
						? ((uncompressedSize - compressedSize) / uncompressedSize) * 100
						: 0;

				compressionStats = {
					uncompressedSize,
					compressedSize,
					compressionRatio: Math.round(compressionRatio * 100) / 100,
				};
			}
		} catch (error) {
			console.error("Failed to calculate compression stats:", error);
		}

		return {
			totalEntries,
			expiredEntries,
			expiredButPreserved,
			isOnline,
			imageStats: {
				totalImages,
				expiredImages,
				expiredButPreserved: expiredImagesButPreserved,
				totalSize: totalImageSize,
			},
			compressionStats,
		};
	}

	async cleanup(): Promise<{ cleanedEntries: number; cleanedImages: number }> {
		if (!getNetworkStatus()) {
			console.log("Cache: Skipping cleanup due to offline status");
			return { cleanedEntries: 0, cleanedImages: 0 };
		}

		const now = Date.now();
		let cleanedCount = 0;
		let cleanedImages = 0;

		// Clean regular cache entries
		for (const [key, entry] of Object.entries(this.cache)) {
			if (now > entry.expiresAt) {
				delete this.cache[key];
				cleanedCount++;
			}
		}

		// Clean expired images
		for (const [key, entry] of Object.entries(this.imageCache)) {
			if (now > entry.expiresAt) {
				try {
					if (fs.existsSync(entry.filePath)) {
						await fs.promises.unlink(entry.filePath);
					}
				} catch (error) {
					console.error(
						`Failed to delete expired image file: ${entry.filePath}`,
						error,
					);
				}
				delete this.imageCache[key];
				cleanedImages++;
			}
		}

		if (cleanedCount > 0) {
			this.isDirty = true;
		}
		if (cleanedImages > 0) {
			this.isImageCacheDirty = true;
		}

		if (cleanedCount > 0 || cleanedImages > 0) {
			await this.saveCache();
		}

		return { cleanedEntries: cleanedCount, cleanedImages };
	}

	private initializeNetworkMonitoring(): void {
		startNetworkMonitoring(30000, (isOnline) => {
			if (isOnline) {
				console.log("Cache: Back online, running cleanup of expired entries");
				setTimeout(() => this.cleanup(), 1000);
			}
		});
	}

	getNetworkStatus(): boolean {
		return getNetworkStatus();
	}

	private startCleanupInterval(): void {
		this.cleanupInterval = setInterval(
			async () => {
				const { cleanedEntries, cleanedImages } = await this.cleanup();
				if (cleanedEntries > 0 || cleanedImages > 0) {
					console.log(
						`Cache cleanup: removed ${cleanedEntries} expired entries and ${cleanedImages} expired images`,
					);
				}
			},
			60 * 60 * 1000,
		);
	}

	private startSaveInterval(): void {
		this.saveInterval = setInterval(
			async () => {
				await this.saveCache();
			},
			5 * 60 * 1000,
		);

		const exitHandler = () => {
			stopNetworkMonitoring();
			if (this.cleanupInterval) clearInterval(this.cleanupInterval);
			if (this.saveInterval) clearInterval(this.saveInterval);
			if (this.isDirty || this.isImageCacheDirty) {
				try {
					const cacheData = {
						cache: this.cache,
						imageCache: this.imageCache,
					};
					const jsonData = JSON.stringify(cacheData);
					gzip(Buffer.from(jsonData, "utf-8"), (err, result) => {
						if (err) {
							console.error("Failed to compress cache on exit:", err);
							return;
						}
						fs.writeFileSync(this.cacheFilePath, result);
					});
				} catch (error) {
					console.error("Failed to save cache on exit:", error);
				}
			}
		};

		process.on("exit", exitHandler);
		process.on("SIGINT", exitHandler);
		process.on("SIGTERM", exitHandler);
	}
}

export const cache = new CacheManager();

export type { CacheOptions, ImageCacheOptions };

export const setCache = <T>(key: string, data: T, ttl?: number) =>
	cache.set(key, data, { ttl });

export const getCache = <T = unknown>(key: string) => cache.get<T>(key);

export const deleteCache = (key: string) => cache.delete(key);

export const hasCache = (key: string) => cache.has(key);

export const clearCache = () => cache.clear();

// Image cache functions
export const setImageCache = (
	key: string,
	imageData: Buffer,
	options?: ImageCacheOptions,
) => cache.setImage(key, imageData, options);

export const getImageCache = (key: string) => cache.getImage(key);

export const deleteImageCache = (key: string) => cache.deleteImage(key);

export const hasImageCache = (key: string) => cache.hasImage(key);

export const clearImageCache = () => cache.clearImages();

export const getCacheNetworkStatus = () => cache.getNetworkStatus();

export const getCacheStats = () => cache.getStats();
