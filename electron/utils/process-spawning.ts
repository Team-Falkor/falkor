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
import sudo from "@expo/sudo-prompt"; // Import the sudo-prompt package

interface ExtendedSpawnOptions extends SpawnOptions {
	runAsAdmin?: boolean;
}

interface SpawnResult {
	process: ChildProcess | null;
	processName: string;
	requiresPolling: boolean;
}

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

		// @expo/sudo-prompt handles platform differences internally
		return handleSudoPromptLaunch(command, args, processName);
	}

	return spawnNonAdmin(command, args, options, processName);
}

function handleSudoPromptLaunch(
	command: string, // This is the full path to the executable
	args: string[],
	processName: string,
): SpawnResult {
	// Ensure the command path itself is quoted, then add the quoted arguments.
	// Windows CMD requires double quotes, and if a path already contains double quotes
	// (which is less common for simple paths but possible), it needs special handling.
	// For most game paths, simple double quoting is sufficient.
	const quotedCommand = `"${command}"`; // Quote the executable path
	const quotedArgs = args
		.map((arg) => `"${arg.replace(/"/g, '\\"')}"`)
		.join(" "); // Quote each argument and escape existing quotes if any

	// Combine the quoted command and its quoted arguments
	const commandToRun = `${quotedCommand} ${quotedArgs}`.trim(); // Use trim() to avoid trailing space if no args

	// Options for sudo-prompt. You can customize the name and icon.
	const sudoOptions = {
		name: "Falkor Game Launcher",
		// icns: '/path/to/your/app.icns', // Optional: for macOS icon
	};

	logger.log("debug", `sudo-prompt command: ${commandToRun}`);

	sudo.exec(commandToRun, sudoOptions, (error, stdout, stderr) => {
		if (error) {
			logger.log(
				"warn",
				`sudo-prompt command finished with error/non-zero exit: ${error.message}`,
			);
		}
		if (stdout) {
			logger.log("debug", `sudo-prompt stdout: ${stdout}`);
		}
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

// ... rest of your code remains the same ...

function spawnNonAdmin(
	command: string,
	args: string[],
	options: ExtendedSpawnOptions,
	processName: string,
): SpawnResult {
	logger.log("info", `Spawning non-admin: ${command} ${args.join(" ")}`);

	try {
		const env = { ...process.env, WINEDEBUG: "fixme-all" };
		const spawnOptions: SpawnOptions = {
			detached: options.detached ?? true,
			stdio: options.stdio ?? "ignore",
			cwd: options.cwd,
			env,
			windowsHide: true,
		};

		const child = spawn(command, args, spawnOptions);

		return {
			process: child,
			processName,
			requiresPolling: false,
		};
	} catch (e) {
		logger.log("error", `Failed to spawn process: ${(e as Error).message}`);
		throw e;
	}
}

// Enhanced process detection utilities
export async function findProcessByName(
	processName: string,
): Promise<number[]> {
	const platform = os.platform();
	const pids: number[] = [];

	try {
		if (platform === "win32") {
			// Ensure .exe is appended for Windows process names
			const { stdout } = await util.promisify(exec)(
				`wmic process where "name='${processName}.exe'" get ProcessId /format:csv`,
			);

			const lines = stdout.split("\n");
			for (const line of lines) {
				const match = line.match(/,(\d+)$/);
				if (match) {
					pids.push(Number.parseInt(match[1], 10));
				}
			}
		} else if (platform === "darwin" || platform === "linux") {
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
		if (err.code !== 1) {
			// Code 1 means no processes found, which is fine
			logger.log("error", `Error finding processes: ${err.message}`);
		}
	}

	return pids;
}

export async function isProcessRunning(processName: string): Promise<boolean> {
	const pids = await findProcessByName(processName);
	return pids.length > 0;
}

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

		// Wait 500ms before checking again
		await new Promise((resolve) => setTimeout(resolve, 500));
	}

	logger.log("warn", `Process ${processName} not found within timeout`);
	return null;
}
