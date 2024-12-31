import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { IGDBReturnDataType, SimilarGame } from "./api/igdb/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns a human-readable string representing the time difference between the
 * current time and the given date, e.g. "3 hours ago", "1 minute ago"
 *
 * @param date - The date to compare the current time to
 * @returns A string representing the time difference
 */
export const timeSince = (date: number): string => {
  const seconds = Math.floor((Date.now() - date) / 1000); // Difference in seconds
  const suffix = seconds === 1 ? "" : "s"; // Pluralize the word 'second'

  // Less than a minute
  if (seconds < 60) return `${seconds} second${suffix} ago`;

  // Less than an hour
  const minutes = Math.floor(seconds / 60); // Difference in minutes
  const minsSuffix = minutes === 1 ? "" : "s"; // Pluralize the word 'minute'
  if (minutes < 60) return `${minutes} minute${minsSuffix} ago`;

  // Less than a day
  const hours = Math.floor(minutes / 60); // Difference in hours
  const hourSuffix = hours === 1 ? "" : "s"; // Pluralize the word 'hour'
  if (hours < 24) return `${hours} hour${hourSuffix} ago`;

  // Less than a week
  const days = Math.floor(hours / 24); // Difference in days
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

  // Less than a month
  const weeks = Math.floor(days / 7); // Difference in weeks
  if (weeks < 4) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;

  // Less than a year
  const months = Math.floor(weeks / 4); // Difference in months
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;

  // More than a year
  const years = Math.floor(months / 12); // Difference in years
  return `${years} year${years === 1 ? "" : "s"} ago`;
};

export const getUserCountry = async (
  sendDefaultOnError = true
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

export const bytesToHumanReadable = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const scrapeOptions = (input: string): Record<string, string[]> => {
  const regex = /<strong>([^<]+)<\/strong>([^<]+)<br>/g;
  let match;
  const options: Record<string, string[]> = {};

  while ((match = regex.exec(input)) !== null) {
    // eslint-disable-next-line prefer-const
    let [_, key, value] = match;
    key = key.replace(/[^A-Za-z0-9:]/g, "").trim();
    if (options[key]) {
      options[key].push(value.trim());
    } else {
      options[key] = [value.trim()];
    }
  }

  return options;
};

/**
 * https://api-docs.igdb.com/#game-enums
 * 0 = main game
 * 8 = remake
 * 9 = remaster
 * 10 = expanded game
 * 11 = port
 * 12 = fork
 */
export const allowedGameCategories: number[] = [0, 8, 9, 10, 11, 12];

export const FilterOutNonePcGames = <
  T extends IGDBReturnDataType | SimilarGame,
>(
  games: T[]
): T[] => {
  return games?.filter(
    (game) =>
      game.platforms?.some((platform) => platform.abbreviation === "PC") &&
      allowedGameCategories.includes(game.category)
  );
};

export const openLink = (url: string) =>
  window.ipcRenderer.invoke("openExternal", url);

/**
 * Invoke an IPC renderer method and return the result as `T` or `null`
 * if the invocation fails.
 * @param channel The IPC channel to invoke.
 * @param args The arguments to pass to the invoked method.
 * @returns The result of the invocation as `T` or `null`.
 */
export const invoke = async <T, A = any>(
  channel: string,
  ...args: A[]
): Promise<T | null> => {
  try {
    return await window.ipcRenderer.invoke(channel, ...args);
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const convertBytesToHumanReadable = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(2)} ${sizes[i]}`;
};

export const getInfoHashFromMagnet = (magnetURI: string): string | null => {
  const match = magnetURI.match(/xt=urn:btih:([a-fA-F0-9]{40,})/);
  return match ? match[1] : null;
};

export const sanitizeFilename = (filename: string): string => {
  // Remove disallowed characters
  const sanitized = filename.replace(/[^a-zA-Z0-9._-\s]/g, "").trim();

  // Enforce a reasonable length
  const maxLength = 255;
  const trimmed = sanitized.slice(0, maxLength);

  // Check for reserved names (Windows-specific)
  const reservedNames = [
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
  if (reservedNames.includes(trimmed.toUpperCase())) {
    return "untitled";
  }

  return trimmed || "untitled";
};
