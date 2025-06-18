import {
	type ChildProcess,
	exec,
	type SpawnOptions,
	spawn,
} from "node:child_process";
import os from "node:os";
import path from "node:path";
import util from "node:util";
import logger from "@backend/handlers/logging";
import sudo from "@expo/sudo-prompt";

interface ExtendedSpawnOptions extends SpawnOptions {
	runAsAdmin?: boolean;
}

interface SpawnResult {
	process: ChildProcess | null;
	processName: string;
	requiresPolling: boolean;
}

/**
 * Safely spawns a child process, with optional administrative privileges.
 * Supports cross-platform elevation using @expo/sudo-prompt.
 *
 * @param command The command to execute.
 * @param args Arguments to pass to the command.
 * @param options Spawn options, including an optional `runAsAdmin` flag.
 * @returns An object indicating the spawned process (if directly available) and
 *          whether process polling is required for tracking.
 */
export function safeSpawn(
	command: string,
	args: string[] = [],
	options: ExtendedSpawnOptions = {},
): SpawnResult {
	const platform = os.platform();
	const processName = path.basename(command, path.extname(command));

	if (options.runAsAdmin) {
		logger.log(
			"info",
			`Attempting to run as admin on ${platform} using @expo/sudo-prompt`,
		);
		return handleSudoPromptLaunch(command, args, processName);
	}

	return spawnNonAdmin(command, args, options, processName);
}

/**
 * Handles launching a command with administrative privileges using @expo/sudo-prompt.
 * This method relies on process polling for tracking as it doesn't return a direct ChildProcess object.
 *
 * @param command The full path to the executable.
 * @param args Arguments to pass to the command.
 * @param processName The base name of the process for tracking.
 * @returns A SpawnResult indicating that polling is required for process tracking.
 */
function handleSudoPromptLaunch(
	command: string,
	args: string[],
	processName: string,
): SpawnResult {
	// Enclose the executable path in double quotes to handle spaces correctly.
	const quotedCommand = `"${command}"`;
	// Quote each argument and escape any existing double quotes within them.
	const quotedArgs = args
		.map((arg) => `"${arg.replace(/"/g, '\\"')}"`)
		.join(" ");

	// Construct the full command string for sudo-prompt.
	const commandToRun = `${quotedCommand} ${quotedArgs}`.trim();

	// Configuration for the sudo-prompt dialog.
	const sudoOptions = {
		name: "Falkor Game Launcher", // Name displayed in the UAC/sudo prompt.
	};

	logger.log("debug", `sudo-prompt command: ${commandToRun}`);

	sudo.exec(commandToRun, sudoOptions, (error, stdout, stderr) => {
		// Log non-zero exits or errors from the elevated command execution.
		if (error) {
			logger.log(
				"warn",
				`sudo-prompt command finished with error/non-zero exit: ${error.message}`,
			);
		}
		// Log standard output from the elevated command.
		if (stdout) {
			logger.log("debug", `sudo-prompt stdout: ${stdout}`);
		}
		// Log standard error from the elevated command.
		if (stderr) {
			logger.log("warn", `sudo-prompt stderr: ${stderr}`);
		}
	});

	logger.log(
		"info",
		`Admin launch initiated via @expo/sudo-prompt. Process tracking will use polling for: ${processName}.`,
	);

	return {
		process: null,
		processName,
		requiresPolling: true,
	};
}

/**
 * Spawns a child process without administrative privileges.
 *
 * @param command The command to execute.
 * @param args Arguments to pass to the command.
 * @param options Spawn options for the child process.
 * @param processName The base name of the process for tracking.
 * @returns A SpawnResult containing the ChildProcess object for direct tracking.
 */
function spawnNonAdmin(
	command: string,
	args: string[],
	options: ExtendedSpawnOptions,
	processName: string,
): SpawnResult {
	logger.log("info", `Spawning non-admin: ${command} ${args.join(" ")}`);

	try {
		// Include environment variables, specifically setting WINEDEBUG for potential Wine compatibility.
		const env = { ...process.env, WINEDEBUG: "fixme-all" };
		const spawnOptions: SpawnOptions = {
			detached: options.detached ?? true, // Detach the child process from the parent.
			stdio: options.stdio ?? "ignore", // Redirect child process I/O to ignore or inherit.
			cwd: options.cwd, // Set the current working directory for the child process.
			env, // Pass environment variables.
			windowsHide: true, // Hide the console window on Windows.
		};

		const child = spawn(command, args, spawnOptions);

		return {
			process: child,
			processName,
			requiresPolling: false, // Direct process tracking is possible.
		};
	} catch (e) {
		logger.log("error", `Failed to spawn process: ${(e as Error).message}`);
		throw e;
	}
}

/**
 * Finds process IDs (PIDs) by their name across different operating systems.
 *
 * @param processName The name of the process to find (e.g., "chrome", "notepad").
 * @returns A promise that resolves to an array of PIDs.
 */
export async function findProcessByName(
	processName: string,
): Promise<number[]> {
	const platform = os.platform();
	const pids: number[] = [];

	try {
		if (platform === "win32") {
			// On Windows, use wmic to find processes by name and get their PIDs.
			// Append ".exe" for common executable names.
			const { stdout } = await util.promisify(exec)(
				`wmic process where "name='${processName}.exe'" get ProcessId /format:csv`,
			);

			const lines = stdout.split("\n");
			for (const line of lines) {
				// Extract PIDs from the CSV formatted output.
				const match = line.match(/,(\d+)$/);
				if (match) {
					pids.push(Number.parseInt(match[1], 10));
				}
			}
		} else if (platform === "darwin" || platform === "linux") {
			// On macOS and Linux, use pgrep for process lookup.
			// The -x flag ensures an exact match for the process name.
			const { stdout } = await util.promisify(exec)(
				`pgrep -x "${processName}"`,
			);

			const lines = stdout.trim().split("\n");
			for (const line of lines) {
				const pid = Number.parseInt(line.trim(), 10);
				if (!Number.isNaN(pid)) {
					pids.push(pid);
				}
			}
		}
	} catch (error) {
		const err = error as { code?: number; message: string };
		// Ignore error code 1, which means no processes were found.
		if (err.code !== 1) {
			logger.log("error", `Error finding processes: ${err.message}`);
		}
	}

	return pids;
}

/**
 * Checks if any process with the given name is currently running.
 *
 * @param processName The name of the process to check.
 * @returns A promise that resolves to `true` if the process is running, `false` otherwise.
 */
export async function isProcessRunning(processName: string): Promise<boolean> {
	const pids = await findProcessByName(processName);
	return pids.length > 0;
}

/**
 * Waits for a process with the given name to start within a specified timeout.
 *
 * @param processName The name of the process to wait for.
 * @param timeoutMs The maximum time (in milliseconds) to wait for the process to start.
 * @returns A promise that resolves to the PID of the first found process, or `null` if the timeout is reached.
 */
export async function waitForProcessToStart(
	processName: string,
	timeoutMs = 10000,
): Promise<number | null> {
	const startTime = Date.now();

	while (Date.now() - startTime < timeoutMs) {
		const pids = await findProcessByName(processName);
		if (pids.length > 0) {
			logger.log(
				"info",
				`Process ${processName} detected with PID: ${pids[0]}`,
			);
			return pids[0];
		}

		// Wait for a short duration before checking again to avoid busy-waiting.
		await new Promise((resolve) => setTimeout(resolve, 500));
	}

	logger.log("warn", `Process ${processName} not found within timeout`);
	return null;
}
