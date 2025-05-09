import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatTimeRemaining(seconds: number): string {
	if (!seconds || seconds === Number.POSITIVE_INFINITY) return "--";
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);

	if (hours > 0) {
		return `${hours}h ${minutes}m`;
	}
	if (minutes > 0) {
		return `${minutes}m ${secs}s`;
	}
	return `${secs}s`;
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

export const bytesToHumanReadable = (bytes: number): string => {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

export const convertBytesToHumanReadable = (bytes: number): string => {
	if (bytes === 0) return "0 Bytes";
	const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	const value = bytes / 1024 ** i;
	return `${value.toFixed(2)} ${sizes[i]}`;
};

export function formatBytes(bytes: number, decimals = 2): string {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

export function scrapeOptions(html: string): Record<string, string[]> {
	const pattern = /<strong>([^<]+)<\/strong>\s*([^<]+?)<br>/g;
	const options: Record<string, string[]> = {};

	for (const [, rawKey, rawValue] of html.matchAll(pattern)) {
		// normalize the key (keep letters, numbers, colons)
		const key = rawKey.replace(/[^\w:]+/g, "").trim();
		const value = rawValue.trim();

		if (!options[key]) {
			options[key] = [];
		}
		options[key].push(value);
	}

	return options;
}
