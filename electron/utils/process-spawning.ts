import {
	type ChildProcess,
	exec,
	type SpawnOptions,
	spawn,
} from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import util from "node:util";
import logger from "@backend/handlers/logging";

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
		logger.log("info", `Attempting to run as admin on ${platform}`);

		try {
			if (platform === "win32") {
				return handleWindowsAdminLaunch(command, args, processName);
			}
			if (platform === "darwin") {
				return handleMacAdminLaunch(command, args, processName);
			}
			if (platform === "linux") {
				return handleLinuxAdminLaunch(command, args, options, processName);
			}

			logger.log("warn", `Admin mode not supported on platform: ${platform}`);
			// Fallback to non-admin
			return spawnNonAdmin(command, args, options, processName);
		} catch (e) {
			logger.log(
				"error",
				`Failed to launch with admin privileges: ${(e as Error).message}`,
			);
			// Fallback to non-admin
			return spawnNonAdmin(command, args, options, processName);
		}
	}

	return spawnNonAdmin(command, args, options, processName);
}

function handleWindowsAdminLaunch(
	command: string,
	args: string[],
	processName: string,
): SpawnResult {
	const gameDir = path.dirname(command);
	const argString = args.map((arg) => `"${arg.replace(/"/g, '`"')}"`).join(" ");

	// Use a batch file approach for better process tracking
	const batchContent = `@echo off
cd /d "${gameDir}"
"${command}" ${argString}`;

	const tempDir = os.tmpdir();
	const batchFile = path.join(tempDir, `game_launcher_${Date.now()}.bat`);

	try {
		fs.writeFileSync(batchFile, batchContent);

		// Launch the batch file with admin privileges
		const psCommand = `Start-Process -FilePath '${batchFile.replace(/'/g, "''")}' -Verb RunAs -WindowStyle Hidden -Wait`;

		logger.log("debug", `PowerShell command: ${psCommand}`);

		const _child = spawn("powershell", ["-Command", psCommand], {
			detached: true,
			stdio: "ignore",
			windowsHide: true,
		});

		// Clean up batch file after a delay
		setTimeout(() => {
			try {
				if (fs.existsSync(batchFile)) {
					fs.unlinkSync(batchFile);
				}
			} catch (e) {
				logger.log("warn", `Failed to cleanup batch file: ${e}`);
			}
		}, 5000);

		logger.log(
			"info",
			"Windows admin launch initiated. Process tracking will use polling.",
		);

		return {
			process: null,
			processName,
			requiresPolling: true,
		};
	} catch (e) {
		logger.log("error", `Failed to create batch file: ${e}`);
		throw e;
	}
}

function handleMacAdminLaunch(
	command: string,
	args: string[],
	processName: string,
): SpawnResult {
	const gameDir = path.dirname(command);
	const quotedArgs = args.map((arg) => `'${arg.replace(/'/g, "'\\''")}'`);
	const commandToRun = `"${command.replace(/"/g, '\\"')}" ${quotedArgs.join(" ")}`;

	// Create a script that changes directory and runs the command
	const script = `do shell script "cd \\"${gameDir.replace(/"/g, '\\"')}\\" && ${commandToRun}" with administrator privileges`;

	logger.log("debug", `osascript command: ${script}`);

	const _child = spawn("osascript", ["-e", script], {
		detached: true,
		stdio: "ignore",
	});

	logger.log(
		"info",
		"macOS admin launch initiated. Process tracking will use polling.",
	);

	return {
		process: null,
		processName,
		requiresPolling: true,
	};
}

function handleLinuxAdminLaunch(
	command: string,
	args: string[],
	options: ExtendedSpawnOptions,
	processName: string,
): SpawnResult {
	const elevator = determineLinuxElevator();
	const cmdArgs = [command, ...args];

	logger.log("info", `Using ${elevator} for elevation.`);

	const child = spawn(elevator, cmdArgs, {
		...options,
		stdio: options.stdio || "inherit",
		detached: true,
	});

	return {
		process: child,
		processName,
		requiresPolling: false,
	};
}

function determineLinuxElevator(): string {
	if (process.env.DISPLAY && fs.existsSync("/usr/bin/pkexec")) {
		return "pkexec";
	}
	if (fs.existsSync("/usr/bin/sudo")) {
		return "sudo";
	}
	if (fs.existsSync("/usr/bin/doas")) {
		return "doas";
	}
	return "sudo"; // Fallback
}

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
