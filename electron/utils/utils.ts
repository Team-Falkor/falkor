import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Response } from "@/@types";

/**
 * Operating system types supported by the application
 */
export type OSType = "macos" | "windows" | "linux";

/**
 * Gets the current operating system type
 * @returns The normalized OS type
 */
export const getOS = (): OSType => {
	try {
		const osType = os.type().toLowerCase();

		switch (osType) {
			case "darwin":
				return "macos";
			case "windows_nt":
				return "windows";
			case "linux":
				return "linux";
			default:
				console.log("warn", `Unknown OS type: ${osType}, defaulting to linux`);
				return "linux";
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.log("error", `Failed to determine OS type: ${errorMessage}`);
		return "linux"; // Default to Linux on error
	}
};

/**
 * Options for filename sanitization
 */
export interface SanitizeFilenameOptions {
	/** Maximum length of the filename (default: 255) */
	maxLength?: number;
	/** Whether to preserve spaces (default: false) */
	preserveSpaces?: boolean;
	/** Default name to use if result is empty (default: "untitled") */
	defaultName?: string;
	/** Additional characters to allow (default: none) */
	additionalAllowedChars?: string;
}

/**
 * Windows reserved filenames that cannot be used
 */
const RESERVED_FILENAMES = [
	"CON",
	"PRN",
	"AUX",
	"NUL",
	"COM1",
	"COM2",
	"COM3",
	"COM4",
	"COM5",
	"COM6",
	"COM7",
	"COM8",
	"COM9",
	"LPT1",
	"LPT2",
	"LPT3",
	"LPT4",
	"LPT5",
	"LPT6",
	"LPT7",
	"LPT8",
	"LPT9",
];

/**
 * Sanitizes a filename to ensure it's valid across different operating systems
 * @param filename The filename to sanitize
 * @param options Sanitization options
 * @returns A sanitized filename
 */
export const sanitizeFilename = (
	filename: string,
	options: SanitizeFilenameOptions = {},
): string => {
	if (!filename || typeof filename !== "string") {
		return options.defaultName || "untitled";
	}

	try {
		// Set defaults
		const {
			maxLength = 255,
			preserveSpaces = false,
			defaultName = "untitled",
			additionalAllowedChars = "",
		} = options;

		// Build regex pattern for allowed characters
		const basePattern = `a-zA-Z0-9._-${additionalAllowedChars}`;
		const pattern = preserveSpaces ? `[^${basePattern}s]` : `[^${basePattern}]`;

		// Remove disallowed characters
		let sanitized = filename.replace(new RegExp(pattern, "g"), "").trim();

		// Replace potentially problematic characters
		sanitized = sanitized
			.replace(/\.\.+/g, ".") // Replace multiple dots with a single dot
			.replace(/^\./g, "") // Remove leading dots
			.replace(/\s+/g, preserveSpaces ? " " : ""); // Handle spaces

		// Enforce a reasonable length
		const trimmed = sanitized.slice(0, maxLength);

		// Check for reserved names (Windows-specific)
		if (RESERVED_FILENAMES.includes(trimmed.toUpperCase().split(".")[0])) {
			return defaultName;
		}

		return trimmed || defaultName;
	} catch (error) {
		console.log("error", `Error sanitizing filename: ${error}`);
		return options.defaultName || "untitled";
	}
};

/**
 * Creates a standardized response object
 * @param message Response message
 * @param error Whether the response indicates an error
 * @param data Optional data payload
 * @returns Formatted response object
 */
export const createResponse = <T>(
	message: string,
	error: boolean,
	data: T | null = null,
): Response<T> => {
	let realMessage = message;

	if (!message || typeof message !== "string") {
		realMessage = error ? "An error occurred" : "Operation completed";
	}

	return {
		message: realMessage,
		error,
		data,
		timestamp: new Date().toISOString(),
	};
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Checks if a path exists and is accessible
 * @param filePath Path to check
 * @returns True if the path exists and is accessible, false otherwise
 */
export const pathExists = (filePath: string): boolean => {
	if (!filePath || typeof filePath !== "string") {
		return false;
	}

	try {
		return existsSync(filePath);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.log("error", `Error checking if path exists: ${errorMessage}`);
		return false;
	}
};

export const getUserCountry = async (
	sendDefaultOnError = true,
): Promise<string> => {
	try {
		const response = await fetch("https://ipinfo.io/json");
		const data = await response.json();
		const countryCode = data.country;
		return countryCode;
	} catch (error) {
		console.error("Error fetching user country:", error);
		if (sendDefaultOnError) return "US";
		return "Unknown";
	}
};

export const getInfoHashFromMagnet = (magnetURI: string): string | null => {
	const match = magnetURI.match(/xt=urn:btih:([a-fA-F0-9]{40,})/);
	return match ? match[1] : null;
};

export const normalizeGameIcon = (
	url: string | undefined | null,
): string | null => {
	if (!url || typeof url !== "string") return null;

	// Trim and normalize slashes
	const trimmed = url.trim();

	if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
		return trimmed;
	}

	if (trimmed.startsWith("//")) {
		return `https:${trimmed}`;
	}

	// If it's a bare domain without protocol
	if (/^[a-zA-Z0-9.-]+\.[a-z]{2,}.*$/.test(trimmed)) {
		return `https://${trimmed}`;
	}

	// Probably a relative path or invalid URL
	return trimmed;
};

export const getErrorMessage = (
	error: unknown,
	customUnkownErrorMessage = "Unkown error",
): string =>
	error instanceof Error
		? error.message
		: typeof error === "string"
			? error
			: customUnkownErrorMessage;
