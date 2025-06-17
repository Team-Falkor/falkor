import {
	type ChildProcess,
	exec,
	type SpawnOptions,
	spawn,
} from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path"; // Import path for path.dirname
import logger from "@backend/handlers/logging";

interface ExtendedSpawnOptions extends SpawnOptions {
	runAsAdmin?: boolean;
}

export function safeSpawn(
	command: string,
	args: string[] = [],
	options: ExtendedSpawnOptions = {},
): ChildProcess | null {
	const platform = os.platform();

	if (options.runAsAdmin) {
		logger.log("info", `Attempting to run as admin on ${platform}`);
		try {
			if (platform === "win32") {
				const gameDir = path.dirname(command);
				const argString = args
					.map((arg) => `"${arg.replace(/"/g, '`"')}"`)
					.join(" ");

				// Construct PowerShell command to set CWD then launch process
				const psCommand = `Set-Location -Path '${gameDir.replace(/'/g, "''")}' ; Start-Process -FilePath '${command.replace(
					/'/g,
					"''",
				)}' -ArgumentList ${argString} -Verb RunAs -WindowStyle Hidden`;

				logger.log("debug", `PowerShell command: ${psCommand}`);

				exec(`powershell -Command "${psCommand}"`, (error, stdout, stderr) => {
					if (error) {
						logger.log(
							"error",
							`PowerShell admin launch error: ${error.message}`,
						);
					} else {
						logger.log(
							"info",
							"PowerShell admin launch command issued successfully.",
						);
					}
					if (stderr) {
						logger.log("warn", `PowerShell admin stderr: ${stderr}`);
					}
					if (stdout) {
						logger.log("info", `PowerShell admin stdout: ${stdout}`);
					}
				});

				logger.log(
					"warn",
					"Windows runAsAdmin using PowerShell: Direct ChildProcess control for the game is lost. Playtime/achievement tracking might be inaccurate.",
				);
				return null;
			}
			if (platform === "darwin") {
				const gameDir = path.dirname(command);
				const quotedArgs = args.map((arg) => `'${arg.replace(/'/g, "'\\''")}'`);
				const commandToRun = `"${command.replace(/"/g, '\\"')}" ${quotedArgs.join(" ")}`;

				// Construct osascript to change directory then execute command
				const script = `do shell script "cd \\"${gameDir.replace(/"/g, '\\"')}\\" && ${commandToRun}" with administrator privileges`;

				logger.log("debug", `osascript command: ${script}`);

				exec(`osascript -e '${script}'`, (error, stdout, stderr) => {
					if (error) {
						logger.log(
							"error",
							`osascript admin launch error: ${error.message}`,
						);
					} else {
						logger.log(
							"info",
							"osascript admin launch command issued successfully.",
						);
					}
					if (stderr) {
						logger.log("warn", `osascript admin stderr: ${stderr}`);
					}
					if (stdout) {
						logger.log("info", `osascript admin stdout: ${stdout}`);
					}
				});
				logger.log(
					"warn",
					"macOS runAsAdmin using osascript: Direct ChildProcess control for the game is lost. Playtime/achievement tracking might be inaccurate.",
				);
				return null;
			}
			if (platform === "linux") {
				const elevator =
					process.env.DISPLAY && fs.existsSync("/usr/bin/pkexec")
						? "pkexec"
						: "sudo";
				const cmdArgs = [command, ...args];
				logger.log("info", `Using ${elevator} for elevation.`);
				const child = spawn(elevator, cmdArgs, {
					...options,
					stdio: "inherit",
				});
				return child;
			}
			logger.log("warn", `Admin mode not supported on platform: ${platform}`);
		} catch (e) {
			logger.log(
				"error",
				`Failed to launch with admin privileges: ${(e as Error).message}`,
			);
			throw e;
		}
	}

	logger.log("info", `Spawning non-admin: ${command} ${args.join(" ")}`);
	try {
		const child = spawn(command, args, options);
		return child;
	} catch (e) {
		logger.log("error", `Failed to spawn process: ${(e as Error).message}`);
		throw e;
	}
}
