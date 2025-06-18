import path from "node:path";
import { shell } from "electron";

/**
 * Resolves actual executable path, following Windows shortcuts when needed.
 */
export function resolveExecutablePath(shortcutOrPath: string): string {
	try {
		if (
			process.platform === "win32" &&
			shortcutOrPath.toLowerCase().endsWith(".lnk")
		) {
			const link = shell.readShortcutLink(shortcutOrPath);
			return link.target && link.target.length > 0
				? path.resolve(path.dirname(shortcutOrPath), link.target)
				: shortcutOrPath;
		}
	} catch (error) {
		// Fallback to original path on error
		console.warn(`Failed to resolve shortcut ${shortcutOrPath}:`, error);
	}
	return shortcutOrPath;
}
