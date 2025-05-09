import {
	type ChildProcess,
	type SpawnOptions,
	spawn,
} from "node:child_process";
import path from "node:path";
import { shell } from "electron";

/**
 * Spawns a new child process in a cross-platform, secure manner.
 * Defaults to detached and ignores stdio unless overridden.
 */
export function safeSpawn(
	command: string,
	args: string[] = [],
	options: SpawnOptions = {},
): ChildProcess {
	const env = { ...process.env, WINEDEBUG: "fixme-all" };
	const spawnOptions: SpawnOptions = {
		detached: options.detached ?? true,
		stdio: options.stdio ?? "ignore",
		cwd: options.cwd,
		env,
		windowsHide: true,
	};
	return spawn(command, args, spawnOptions);
}

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
	} catch {
		// TODO: Fallback to original path on error
	}
	return shortcutOrPath;
}
