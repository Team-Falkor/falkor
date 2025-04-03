import { Response } from "@/@types";
import { app } from "electron";
import { existsSync } from "node:fs";
import os from "node:os";
import path, { join } from "node:path";
import { fileURLToPath } from "node:url";

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
  "CON", "PRN", "AUX", "NUL",
  "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
  "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
];

/**
 * Sanitizes a filename to ensure it's valid across different operating systems
 * @param filename The filename to sanitize
 * @param options Sanitization options
 * @returns A sanitized filename
 */
export const sanitizeFilename = (filename: string, options: SanitizeFilenameOptions = {}): string => {
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
      .replace(/^\./g, "")    // Remove leading dots
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
  data: T | null = null
): Response<T> => {
  if (!message || typeof message !== "string") {
    message = error ? "An error occurred" : "Operation completed";
  }
  
  return {
    message,
    error,
    data,
    timestamp: new Date().toISOString(),
  };
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Gets the absolute path to a sound file
 * @param soundPath Relative path to the sound file
 * @returns Absolute path to the sound file or empty string on error
 */
export const getSoundPath = (soundPath: string): string => {
  if (!soundPath || typeof soundPath !== "string") {
    console.log("error", "Invalid sound path provided");
    return "";
  }
  
  try {
    // Determine the base path based on whether the app is packaged
    const basePath = app.isPackaged
      ? join(process.resourcesPath, "sounds")
      : join(__dirname, "..", "resources", "sounds");
    
    // Construct the full path
    const fullPath = join(basePath, soundPath);
    
    // Verify the file exists
    if (!existsSync(fullPath)) {
      console.log("warn", `Sound file not found: ${fullPath}`);
    }
    
    return fullPath;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log("error", `Error getting sound path: ${errorMessage}`);
    return "";
  }
};

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
