import { exec, execSync } from "node:child_process";
import { existsSync } from "node:fs";

/**
 * Options for sound playback
 */
interface PlaySoundOptions {
	/** Volume level (0 to 1) */
	volume?: number;
	/** Whether to play synchronously (blocking) */
	sync?: boolean;
	/** Whether to suppress error messages */
	silent?: boolean;
	/** Timeout in milliseconds for async playback */
	timeout?: number;
}

/**
 * Result of a sound playback attempt
 */
interface PlaySoundResult {
	success: boolean;
	error?: string;
}

/**
 * Plays a sound file natively based on the operating system with customizable options.
 *
 * @param soundPath - The absolute path to the sound file.
 * @param options - Optional configuration for playback behavior
 * @returns Promise resolving to information about the playback result
 */
export const playSound = async (
	soundPath: string,
	options: PlaySoundOptions = {},
): Promise<PlaySoundResult> => {
	const { volume, sync = false, silent = false, timeout } = options;

	// Validate file existence
	if (!existsSync(soundPath)) {
		const errorMsg = `Sound file does not exist: ${soundPath}`;
		if (!silent) console.warn(errorMsg);
		return { success: false, error: errorMsg };
	}

	// Escape path for shell command safety
	const escapedPath = soundPath.replace(/"/g, '\\"');

	// Get appropriate command for platform
	const command = getPlayCommand(escapedPath, volume);
	if (!command) {
		const errorMsg = `Unsupported platform for sound playback: ${process.platform}`;
		if (!silent) console.warn(errorMsg);
		return { success: false, error: errorMsg };
	}

	try {
		if (sync) {
			// Synchronous execution (still wrapped in a promise)
			if (process.platform === "win32") {
				execSync(command, { shell: "powershell.exe" });
			} else {
				execSync(command);
			}
			return { success: true };
		}
		// Asynchronous execution with promise
		return new Promise((resolve) => {
			const execOptions: { shell?: string; timeout?: number } = {};
			if (process.platform === "win32") {
				execOptions.shell = "powershell.exe";
			}
			if (timeout) {
				execOptions.timeout = timeout;
			}

			exec(command, execOptions, (error) => {
				if (error && !silent) {
					console.warn(`Error playing sound: ${error.message}`);
					resolve({ success: false, error: error.message });
				} else {
					resolve({ success: true });
				}
			});
		});
	} catch (error) {
		const errorMsg = `Failed to execute sound playback: ${error}`;
		if (!silent) console.warn(errorMsg);
		return { success: false, error: errorMsg as string };
	}
};

/**
 * Generates the appropriate sound playback command based on the platform.
 */
function getPlayCommand(escapedPath: string, volume?: number): string | null {
	switch (process.platform) {
		case "win32":
			// Fixed PowerShell command syntax
			return `powershell.exe -Command "(New-Object System.Media.SoundPlayer '${escapedPath}').PlaySync()"`;

		case "darwin": {
			const macVolume =
				volume !== undefined ? Math.max(0, Math.min(volume, 1)) : 0.7;
			return `afplay "${escapedPath}" -v ${macVolume}`;
		}

		case "linux": {
			if (volume !== undefined) {
				// Convert volume to paplay's 0-65536 range
				const pulseVolume = Math.floor(
					Math.max(0, Math.min(volume, 100)) * 655.36,
				);
				return `paplay --volume ${pulseVolume} "${escapedPath}" || aplay "${escapedPath}"`;
			}
			return `paplay "${escapedPath}" || aplay "${escapedPath}"`;
		}

		default:
			return null;
	}
}
