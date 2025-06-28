import fs from "node:fs";
import path from "node:path";
import logger from "@backend/handlers/logging";
import { shell } from "electron";

/**
 * Enhanced executable path resolution with better error handling and validation
 */
export function resolveExecutablePath(shortcutOrPath: string): string {
	if (!shortcutOrPath || typeof shortcutOrPath !== "string") {
		throw new Error("Invalid path: must be a non-empty string");
	}

	const normalizedPath = path.normalize(shortcutOrPath.trim());

	try {
		// Handle Windows shortcuts
		if (
			process.platform === "win32" &&
			normalizedPath.toLowerCase().endsWith(".lnk")
		) {
			return resolveWindowsShortcut(normalizedPath);
		}

		// Handle symbolic links on Unix-like systems
		if (process.platform !== "win32" && fs.existsSync(normalizedPath)) {
			const stats = fs.lstatSync(normalizedPath);
			if (stats.isSymbolicLink()) {
				return resolveSymbolicLink(normalizedPath);
			}
		}

		return normalizedPath;
	} catch (error) {
		logger.log(
			"warn",
			`Failed to resolve path ${shortcutOrPath}: ${(error as Error).message}`,
		);
		return normalizedPath; // Fallback to normalized path
	}
}

/**
 * Resolves Windows .lnk shortcut files
 */
function resolveWindowsShortcut(shortcutPath: string): string {
	try {
		if (!fs.existsSync(shortcutPath)) {
			throw new Error(`Shortcut file does not exist: ${shortcutPath}`);
		}

		const link = shell.readShortcutLink(shortcutPath);

		if (!link.target || link.target.length === 0) {
			throw new Error(`Shortcut has no target: ${shortcutPath}`);
		}

		// Resolve relative paths
		const targetPath = path.isAbsolute(link.target)
			? link.target
			: path.resolve(path.dirname(shortcutPath), link.target);

		// Validate target exists
		if (!fs.existsSync(targetPath)) {
			logger.log("warn", `Shortcut target does not exist: ${targetPath}`);
			return shortcutPath; // Return original if target doesn't exist
		}

		logger.log("debug", `Resolved shortcut ${shortcutPath} -> ${targetPath}`);
		return targetPath;
	} catch (error) {
		logger.log(
			"error",
			`Failed to resolve Windows shortcut ${shortcutPath}: ${(error as Error).message}`,
		);
		throw error;
	}
}

/**
 * Resolves symbolic links on Unix-like systems
 */
function resolveSymbolicLink(linkPath: string): string {
	try {
		const targetPath = fs.readlinkSync(linkPath);
		const resolvedPath = path.isAbsolute(targetPath)
			? targetPath
			: path.resolve(path.dirname(linkPath), targetPath);

		// Recursively resolve if target is also a symbolic link
		if (fs.existsSync(resolvedPath)) {
			const stats = fs.lstatSync(resolvedPath);
			if (stats.isSymbolicLink()) {
				return resolveSymbolicLink(resolvedPath);
			}
		}

		logger.log(
			"debug",
			`Resolved symbolic link ${linkPath} -> ${resolvedPath}`,
		);
		return resolvedPath;
	} catch (error) {
		logger.log(
			"error",
			`Failed to resolve symbolic link ${linkPath}: ${(error as Error).message}`,
		);
		throw error;
	}
}

/**
 * Validates if a path points to an executable file
 */
export function validateExecutable(executablePath: string): {
	isValid: boolean;
	error?: string;
} {
	try {
		if (!fs.existsSync(executablePath)) {
			return { isValid: false, error: "File does not exist" };
		}

		const stats = fs.statSync(executablePath);

		if (!stats.isFile()) {
			return { isValid: false, error: "Path is not a file" };
		}

		// Check if file is executable (Unix-like systems)
		if (process.platform !== "win32") {
			try {
				fs.accessSync(executablePath, fs.constants.X_OK);
			} catch {
				return { isValid: false, error: "File is not executable" };
			}
		}

		return { isValid: true };
	} catch (error) {
		return { isValid: false, error: (error as Error).message };
	}
}
