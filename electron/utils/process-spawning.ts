import {
	type ChildProcess,
	exec,
	type SpawnOptions,
	spawn,
} from "node:child_process";
import os from "node:os";
import path from "node:path";
import util from "node:util";
import logger from "@backend/handlers/logging"; // Ensure this import path is correct
import sudo from "@expo/sudo-prompt";

interface ExtendedSpawnOptions extends SpawnOptions {
	runAsAdmin?: boolean;
}

interface SpawnResult {
	process: ChildProcess | null;
	processName: string;
	requiresPolling: boolean;
}

const execPromise = util.promisify(exec); // Promisify exec once for reuse

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

	logger.log(
		"debug",
		`safeSpawn: Command: '${command}', Args: [${args.join(", ")}], Options: ${JSON.stringify(options)}`,
	);

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
		.map((arg) => {
			const sanitizedArg = arg.replace(/"/g, '\\"'); // Escape existing quotes
			return `"${sanitizedArg}"`; // Quote the whole argument
		})
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
				`sudo-prompt command finished with error/non-zero exit: ${error.message}. Stderr: ${stderr || "N/A"}`,
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
	logger.log(
		"info",
		`Spawning non-admin: command='${command}', args='${args.join(" ")}', cwd='${options.cwd || process.cwd()}'`,
	);

	try {
		// Include environment variables, specifically setting WINEDEBUG for potential Wine compatibility.
		// Merge provided env with process.env
		const env = { ...process.env, WINEDEBUG: "fixme-all", ...options.env };
		const spawnOptions: SpawnOptions = {
			detached: options.detached ?? true, // Detach the child process from the parent.
			stdio: options.stdio ?? "ignore", // Redirect child process I/O to ignore or inherit.
			cwd: options.cwd, // Set the current working directory for the child process.
			env, // Pass environment variables.
			windowsHide: options.windowsHide ?? true, // Hide the console window on Windows.
			shell: options.shell, // Explicitly pass shell option if present
		};

		const child = spawn(command, args, spawnOptions);

		logger.log(
			"debug",
			`Process '${processName}' spawned with PID: ${child.pid}`,
		);

		child.on("error", (err) => {
			logger.log(
				"error",
				`Spawned process '${processName}' (PID: ${child.pid}) encountered error: ${err.message}`,
			);
		});

		child.on("exit", (code, signal) => {
			logger.log(
				"debug",
				`Spawned process '${processName}' (PID: ${child.pid}) exited with code ${code} and signal ${signal}`,
			);
		});

		return {
			process: child,
			processName,
			requiresPolling: false, // Direct process tracking is possible.
		};
	} catch (e) {
		logger.log(
			"error",
			`Failed to spawn process '${command}': ${(e as Error).message}`,
		);
		throw e; // Re-throw to indicate immediate failure
	}
}

/**
 * Generates various common permutations of a process name for robust searching.
 *
 * @param originalName The original process name (e.g., "My Game", "My_Game", "mygame.exe").
 * @returns An array of potential process names to search for.
 */
function generateProcessNamePermutations(originalName: string): string[] {
	const permutations = new Set<string>();
	const baseName = path.basename(originalName, path.extname(originalName));
	const extension = path.extname(originalName).toLowerCase();

	// 1. Original name (with or without .exe, as provided)
	permutations.add(originalName);

	// 2. Base name only (no extension)
	permutations.add(baseName);

	// 3. Lowercase versions
	permutations.add(originalName.toLowerCase());
	permutations.add(baseName.toLowerCase());

	// 4. Handle spaces/underscores/dashes in base name
	const cleanedBaseName = baseName.replace(/[\s\-_]/g, ""); // Remove spaces, underscores, dashes
	permutations.add(cleanedBaseName);
	permutations.add(cleanedBaseName.toLowerCase());

	// If the original name had spaces, try replacing them with underscores or removing them
	if (baseName.includes(" ")) {
		const underscoreName = baseName.replace(/ /g, "_");
		permutations.add(underscoreName);
		permutations.add(underscoreName.toLowerCase());
	}

	// Add .exe variants for Windows
	if (os.platform() === "win32") {
		const winVariants = new Set<string>();
		permutations.forEach((name) => {
			winVariants.add(name); // Add as is
			if (!name.toLowerCase().endsWith(".exe")) {
				winVariants.add(`${name}.exe`);
			}
		});
		winVariants.forEach((v) => permutations.add(v));
	}

	const result = Array.from(permutations).sort(); // Sort for consistent order (optional)
	logger.log(
		"debug",
		`Generated permutations for '${originalName}': [${result.join(", ")}]`,
	);
	return result;
}

/**
 * Finds process IDs (PIDs) by their name across different operating systems,
 * trying multiple permutations of the process name for robustness.
 *
 * @param processName The name of the process to find (e.g., "chrome", "MyGame", "My Game.exe").
 * @returns A promise that resolves to an array of unique PIDs.
 *                               Returns an empty array if no processes are found or on error.
 */
export async function findProcessByName(
	processName: string,
): Promise<number[]> {
	const platform = os.platform();
	const uniquePids = new Set<number>(); // Use a Set to store unique PIDs
	const namesToTry = generateProcessNamePermutations(processName);

	logger.log(
		"debug",
		`findProcessByName: Searching for permutations of '${processName}' on platform '${platform}'`,
	);

	for (const name of namesToTry) {
		logger.log(
			"debug",
			`findProcessByName: Attempting to find process by: '${name}'`,
		);
		try {
			const currentPids: number[] = [];
			if (platform === "win32") {
				// On Windows, use wmic to find processes by name and get their PIDs.
				// The `name='${name}'` needs to be exact including '.exe' if it's there.
				const command = `wmic process where "name='${name}'" get ProcessId /format:csv`;
				logger.log("debug", `Executing Windows command: ${command}`);

				const { stdout } = await execPromise(command);

				const lines = stdout
					.split(/\r?\n/)
					.filter((line) => line.trim().length > 0);

				for (const line of lines) {
					const match = line.match(/,(\d+)$/);
					if (match) {
						const pid = Number.parseInt(match[1], 10);
						if (!Number.isNaN(pid)) {
							currentPids.push(pid);
						}
					}
				}
			} else if (platform === "darwin" || platform === "linux") {
				// On macOS and Linux, use pgrep for process lookup.
				// -x ensures exact match. -i for case-insensitivity might be needed if base name varies by case.
				// We rely on permutations to cover different spellings.
				const command = `pgrep -x "${name}"`;
				logger.log("debug", `Executing Unix-like command: ${command}`);

				const { stdout } = await execPromise(command);

				const lines = stdout
					.trim()
					.split("\n")
					.filter((line) => line.trim().length > 0);

				for (const line of lines) {
					const pid = Number.parseInt(line.trim(), 10);
					if (!Number.isNaN(pid)) {
						currentPids.push(pid);
					}
				}
			} else {
				logger.log(
					"warn",
					`findProcessByName: Unsupported platform: '${platform}'. Cannot find processes by name.`,
				);
				// If platform is unsupported, break and return what we have (likely empty)
				break;
			}

			if (currentPids.length > 0) {
				logger.log(
					"debug",
					`Found PIDs for '${name}': [${currentPids.join(", ")}]`,
				);
				currentPids.forEach((pid) => uniquePids.add(pid));
				// Optimization: If we found something, maybe we don't need to try all permutations?
				// This depends on whether you want ALL matching PIDs or just "any" PID.
				// For robustness, we continue trying all permutations.
			}
		} catch (error) {
			const err = error as { code?: number; message: string; stderr?: string };
			// `pgrep` on Unix-like systems exits with code 1 if no processes are found.
			if ((platform === "darwin" || platform === "linux") && err.code === 1) {
				logger.log(
					"debug",
					`findProcessByName: No processes found for '${name}' (pgrep exited with code 1).`,
				);
			} else {
				// Log full error for other issues, including stderr for more context.
				logger.log(
					"warn", // Changed to warn as we're retrying with other names
					`findProcessByName: Error attempting to find processes for '${name}': ${err.message}. Stderr: ${err.stderr || "N/A"}.`,
				);
			}
		}
	}

	const resultPids = Array.from(uniquePids);
	logger.log(
		"debug",
		`findProcessByName: Final unique PIDs found for '${processName}': [${resultPids.join(", ")}]`,
	);
	return resultPids;
}

/**
 * Checks if any process with the given name is currently running.
 *
 * @param processName The name of the process to check.
 * @returns A promise that resolves to `true` if the process is running, `false` otherwise.
 */
export async function isProcessRunning(processName: string): Promise<boolean> {
	logger.log("debug", `isProcessRunning: Checking for '${processName}'`);
	const pids = await findProcessByName(processName);
	const isRunning = pids.length > 0;
	logger.log(
		"debug",
		`isProcessRunning: '${processName}' is running: ${isRunning} (Found PIDs: ${pids.length})`,
	);
	return isRunning;
}

/**
 * Waits for a process with the given name to start within a specified timeout.
 *
 * @param processName The name of the process to wait for.
 * @param timeoutMs The maximum time (in milliseconds) to wait for the process to start.
 * @param checkIntervalMs The interval (in milliseconds) between checks.
 * @returns A promise that resolves to the PID of the first found process, or `null` if the timeout is reached.
 */
export async function waitForProcessToStart(
	processName: string,
	timeoutMs = 10000,
	checkIntervalMs = 500,
): Promise<number | null> {
	const startTime = Date.now();
	logger.log(
		"debug",
		`waitForProcessToStart: Waiting for '${processName}' for max ${timeoutMs}ms (check every ${checkIntervalMs}ms).`,
	);

	while (Date.now() - startTime < timeoutMs) {
		const pids = await findProcessByName(processName);
		if (pids.length > 0) {
			logger.log(
				"info",
				`waitForProcessToStart: Process '${processName}' detected with PID: ${pids[0]}`,
			);
			return pids[0];
		}

		logger.log(
			"debug",
			`waitForProcessToStart: Process '${processName}' not yet found. Retrying in ${checkIntervalMs}ms...`,
		);
		// Wait for a short duration before checking again to avoid busy-waiting.
		await new Promise((resolve) => setTimeout(resolve, checkIntervalMs));
	}

	logger.log(
		"warn",
		`waitForProcessToStart: Process '${processName}' not found within timeout of ${timeoutMs}ms.`,
	);
	return null;
}
