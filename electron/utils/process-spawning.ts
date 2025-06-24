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

interface ProcessInfo {
	pid: number;
	name: string;
	elevated?: boolean;
}

const execPromise = util.promisify(exec);

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

function handleSudoPromptLaunch(
	command: string,
	args: string[],
	processName: string,
): SpawnResult {
	const quotedCommand = `"${command}"`;
	const quotedArgs = args
		.map((arg) => {
			const sanitizedArg = arg.replace(/"/g, '\\"');
			return `"${sanitizedArg}"`;
		})
		.join(" ");

	const commandToRun = `${quotedCommand} ${quotedArgs}`.trim();

	const sudoOptions = {
		name: "Falkor Game Launcher",
	};

	logger.log("debug", `sudo-prompt command: ${commandToRun}`);

	sudo.exec(commandToRun, sudoOptions, (error, stdout, stderr) => {
		if (error) {
			logger.log(
				"warn",
				`sudo-prompt command finished with error/non-zero exit: ${error.message}. Stderr: ${stderr || "N/A"}`,
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
		const env = { ...process.env, WINEDEBUG: "fixme-all", ...options.env };
		const spawnOptions: SpawnOptions = {
			detached: options.detached ?? true,
			stdio: options.stdio ?? "ignore",
			cwd: options.cwd,
			env,
			windowsHide: options.windowsHide ?? true,
			shell: options.shell,
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
			requiresPolling: false,
		};
	} catch (e) {
		logger.log(
			"error",
			`Failed to spawn process '${command}': ${(e as Error).message}`,
		);
		throw e;
	}
}

function generateProcessNamePermutations(originalName: string): string[] {
	const permutations = new Set<string>();
	const baseName = path.basename(originalName, path.extname(originalName));

	permutations.add(originalName);

	permutations.add(baseName);

	permutations.add(originalName.toLowerCase());
	permutations.add(baseName.toLowerCase());

	const cleanedBaseName = baseName.replace(/[\s\-_]/g, "");
	permutations.add(cleanedBaseName);
	permutations.add(cleanedBaseName.toLowerCase());

	if (baseName.includes(" ")) {
		const underscoreName = baseName.replace(/ /g, "_");
		permutations.add(underscoreName);
		permutations.add(underscoreName.toLowerCase());
	}

	if (os.platform() === "win32") {
		const winVariants = new Set<string>();
		permutations.forEach((name) => {
			winVariants.add(name);
			if (!name.toLowerCase().endsWith(".exe")) {
				winVariants.add(`${name}.exe`);
			}
		});
		winVariants.forEach((v) => permutations.add(v));
	}

	const result = Array.from(permutations).sort();
	logger.log(
		"debug",
		`Generated permutations for '${originalName}': [${result.join(", ")}]`,
	);
	return result;
}

async function findProcessesByNameRobust(
	processName: string,
): Promise<ProcessInfo[]> {
	const platform = os.platform();
	const allProcesses: ProcessInfo[] = [];
	const namesToTry = generateProcessNamePermutations(processName);

	logger.log(
		"debug",
		`findProcessesByNameRobust: Searching for '${processName}' on ${platform}`,
	);

	if (platform === "win32") {
		for (const name of namesToTry) {
			try {
				const standardResults = await Promise.race([
					findProcessesWindowsStandard(name),
					new Promise<ProcessInfo[]>((_, reject) =>
						setTimeout(() => reject(new Error("Timeout")), 3000),
					),
				]);
				allProcesses.push(...standardResults);
			} catch (error) {
				logger.log(
					"debug",
					`Standard method failed for '${name}': ${(error as Error).message}`,
				);
			}
		}

		for (const name of namesToTry) {
			try {
				const tasklistResults = await Promise.race([
					findProcessesWindowsTasklist(name),
					new Promise<ProcessInfo[]>((_, reject) =>
						setTimeout(() => reject(new Error("Timeout")), 3000),
					),
				]);
				const newResults = tasklistResults.filter(
					(ps) => !allProcesses.some((existing) => existing.pid === ps.pid),
				);
				allProcesses.push(...newResults);
			} catch (error) {
				logger.log(
					"debug",
					`Tasklist method failed for '${name}': ${(error as Error).message}`,
				);
			}
		}

		if (allProcesses.length === 0) {
			for (const name of namesToTry) {
				try {
					const powershellResults = await Promise.race([
						findProcessesWindowsPowerShell(name),
						new Promise<ProcessInfo[]>((_, reject) =>
							setTimeout(() => reject(new Error("Timeout")), 5000),
						),
					]);
					const newResults = powershellResults.filter(
						(ps) => !allProcesses.some((existing) => existing.pid === ps.pid),
					);
					allProcesses.push(...newResults);
					if (newResults.length > 0) break;
				} catch (error) {
					logger.log(
						"debug",
						`PowerShell method failed for '${name}': ${(error as Error).message}`,
					);
				}
			}
		}

		if (allProcesses.length === 0) {
			for (const name of namesToTry) {
				try {
					const wmicAltResults = await Promise.race([
						findProcessesWindowsWMICAlternative(name),
						new Promise<ProcessInfo[]>((_, reject) =>
							setTimeout(() => reject(new Error("Timeout")), 4000),
						),
					]);
					const newResults = wmicAltResults.filter(
						(ps) => !allProcesses.some((existing) => existing.pid === ps.pid),
					);
					allProcesses.push(...newResults);
					if (newResults.length > 0) break;
				} catch (error) {
					logger.log(
						"debug",
						`Alternative WMIC method failed for '${name}': ${(error as Error).message}`,
					);
				}
			}
		}
	} else if (platform === "darwin" || platform === "linux") {
		for (const name of namesToTry) {
			try {
				const unixResults = await Promise.race([
					findProcessesUnix(name),
					new Promise<ProcessInfo[]>((_, reject) =>
						setTimeout(() => reject(new Error("Timeout")), 3000),
					),
				]);
				const newResults = unixResults.filter(
					(ps) => !allProcesses.some((existing) => existing.pid === ps.pid),
				);
				allProcesses.push(...newResults);
			} catch (error) {
				logger.log(
					"debug",
					`Unix method failed for '${name}': ${(error as Error).message}`,
				);
			}
		}
	}

	const uniqueProcesses = allProcesses
		.filter(
			(process, index, self) =>
				index === self.findIndex((p) => p.pid === process.pid),
		)
		.sort((a, b) => a.pid - b.pid);

	logger.log(
		"debug",
		`findProcessesByNameRobust: Found ${uniqueProcesses.length} unique processes for '${processName}'`,
	);
	return uniqueProcesses;
}

async function findProcessesWindowsStandard(
	processName: string,
): Promise<ProcessInfo[]> {
	const command = `wmic process where "name='${processName}'" get ProcessId,Name /format:csv`;
	logger.log("debug", `Executing Windows standard command: ${command}`);

	const { stdout } = await execPromise(command);
	const processes: ProcessInfo[] = [];

	const lines = stdout.split(/\r?\n/).filter((line) => line.trim().length > 0);
	for (const line of lines) {
		const parts = line.split(",");
		if (parts.length >= 3) {
			const name = parts[1]?.trim();
			const pidStr = parts[2]?.trim();

			if (name && pidStr && !Number.isNaN(Number(pidStr))) {
				processes.push({
					pid: Number(pidStr),
					name: name,
					elevated: false,
				});
			}
		}
	}

	return processes;
}

async function findProcessesWindowsPowerShell(
	processName: string,
): Promise<ProcessInfo[]> {
	const cleanName = processName.replace(/\.exe$/i, "");

	const psScript = `
		$processes = Get-Process -Name '${cleanName}' -ErrorAction SilentlyContinue
		foreach ($proc in $processes) {
			$elevated = $false
			try {
				$handle = $proc.Handle
				$elevated = ($proc.PriorityClass -eq 'High') -or ($proc.WorkingSet64 -gt 104857600)
			} catch {
				$elevated = $false
			}
			Write-Output ($proc.Id.ToString() + ',' + $proc.ProcessName + ',' + $elevated.ToString())
		}
	`
		.replace(/\t/g, "")
		.replace(/\n\s*/g, "; ");

	const encodedCommand = Buffer.from(psScript, "utf16le").toString("base64");
	const command = `powershell -EncodedCommand ${encodedCommand}`;

	logger.log(
		"debug",
		"Executing PowerShell command for process detection (encoded)",
	);

	try {
		const { stdout } = await execPromise(command, { timeout: 5000 });
		const processes: ProcessInfo[] = [];

		const lines = stdout
			.trim()
			.split("\n")
			.filter((line) => line.trim().length > 0);
		for (const line of lines) {
			const parts = line.trim().split(",");
			if (parts.length >= 3) {
				const pidStr = parts[0]?.trim();
				const name = parts[1]?.trim();
				const elevated = parts[2]?.trim().toLowerCase() === "true";

				if (pidStr && name && !Number.isNaN(Number(pidStr))) {
					processes.push({
						pid: Number(pidStr),
						name: name,
						elevated: elevated,
					});
				}
			}
		}

		return processes;
	} catch {
		logger.log("debug", "Encoded PowerShell failed, trying simple approach");
		return await findProcessesWindowsPowerShellSimple(cleanName);
	}
}

async function findProcessesWindowsPowerShellSimple(
	processName: string,
): Promise<ProcessInfo[]> {
	const command = `powershell -Command "Get-Process -Name '${processName}' -ErrorAction SilentlyContinue | Select-Object Id,ProcessName | ConvertTo-Csv -NoTypeInformation"`;

	logger.log("debug", "Executing simple PowerShell command");

	const { stdout } = await execPromise(command, { timeout: 3000 });
	const processes: ProcessInfo[] = [];

	const lines = stdout
		.trim()
		.split("\n")
		.filter((line) => line.trim().length > 0);
	const dataLines = lines.filter(
		(line) => !line.includes('"Id"') && !line.includes('"ProcessName"'),
	);

	for (const line of dataLines) {
		const csvMatch = line.match(/"(\d+)","([^"]+)"/);
		if (csvMatch) {
			const [, pidStr, name] = csvMatch;
			const pid = Number(pidStr);

			if (!Number.isNaN(pid)) {
				processes.push({
					pid: pid,
					name: name,
					elevated: false,
				});
			}
		}
	}

	return processes;
}

async function findProcessesWindowsWMICAlternative(
	processName: string,
): Promise<ProcessInfo[]> {
	const command = `wmic process get Name,ProcessId /format:list | findstr /i "${processName}"`;
	logger.log("debug", `Executing alternative WMIC command: ${command}`);

	const { stdout } = await execPromise(command);
	const processes: ProcessInfo[] = [];

	const lines = stdout.split(/\r?\n/).filter((line) => line.trim().length > 0);
	let currentName = "";
	let currentPid = "";

	for (const line of lines) {
		const trimmedLine = line.trim();
		if (trimmedLine.startsWith("Name=")) {
			currentName = trimmedLine.substring(5);
		} else if (trimmedLine.startsWith("ProcessId=")) {
			currentPid = trimmedLine.substring(10);

			if (
				currentName &&
				currentPid &&
				currentName.toLowerCase().includes(processName.toLowerCase())
			) {
				const pid = Number(currentPid);
				if (!Number.isNaN(pid)) {
					processes.push({
						pid: pid,
						name: currentName,
						elevated: false,
					});
				}
			}
			currentName = "";
			currentPid = "";
		}
	}

	return processes;
}

async function findProcessesWindowsTasklist(
	processName: string,
): Promise<ProcessInfo[]> {
	const command = `tasklist /FI "IMAGENAME eq ${processName}" /FO CSV /NH`;
	logger.log("debug", `Executing tasklist command: ${command}`);

	const { stdout } = await execPromise(command);
	const processes: ProcessInfo[] = [];

	const lines = stdout
		.trim()
		.split("\n")
		.filter((line) => line.trim().length > 0);
	for (const line of lines) {
		const csvMatch = line.match(
			/"([^"]+)","([^"]+)","([^"]+)","([^"]+)","([^"]+)"/,
		);
		if (csvMatch) {
			const [, imageName, pidStr] = csvMatch;
			const pid = Number(pidStr);

			if (!Number.isNaN(pid)) {
				processes.push({
					pid: pid,
					name: imageName,
					elevated: false,
				});
			}
		}
	}

	return processes;
}

async function findProcessesUnix(processName: string): Promise<ProcessInfo[]> {
	const command = `pgrep -x "${processName}"`;
	logger.log("debug", `Executing Unix command: ${command}`);

	const { stdout } = await execPromise(command);
	const processes: ProcessInfo[] = [];

	const lines = stdout
		.trim()
		.split("\n")
		.filter((line) => line.trim().length > 0);
	for (const line of lines) {
		const pid = Number(line.trim());
		if (!Number.isNaN(pid)) {
			processes.push({
				pid: pid,
				name: processName,
				elevated: false,
			});
		}
	}

	return processes;
}

export async function findProcessByName(
	processName: string,
): Promise<number[]> {
	logger.log("debug", `findProcessByName: Searching for '${processName}'`);

	try {
		const processes = await findProcessesByNameRobust(processName);
		const pids = processes.map((p) => p.pid);

		logger.log("debug", `findProcessByName: Found PIDs: [${pids.join(", ")}]`);

		const elevatedCount = processes.filter((p) => p.elevated).length;
		if (elevatedCount > 0) {
			logger.log(
				"info",
				`findProcessByName: Found ${elevatedCount} elevated processes for '${processName}'`,
			);
		}

		return pids;
	} catch (error) {
		logger.log(
			"error",
			`findProcessByName: Error searching for '${processName}': ${(error as Error).message}`,
		);
		return [];
	}
}

export async function findProcessInfoByName(
	processName: string,
): Promise<ProcessInfo[]> {
	logger.log("debug", `findProcessInfoByName: Searching for '${processName}'`);

	try {
		const processes = await findProcessesByNameRobust(processName);
		logger.log(
			"debug",
			`findProcessInfoByName: Found ${processes.length} processes for '${processName}'`,
		);
		return processes;
	} catch (error) {
		logger.log(
			"error",
			`findProcessInfoByName: Error searching for '${processName}': ${(error as Error).message}`,
		);
		return [];
	}
}

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

export async function isProcessRunningWithElevation(
	processName: string,
): Promise<{
	isRunning: boolean;
	hasElevated: boolean;
	processCount: number;
	elevatedCount: number;
}> {
	logger.log(
		"debug",
		`isProcessRunningWithElevation: Checking for '${processName}'`,
	);
	const processes = await findProcessInfoByName(processName);

	const isRunning = processes.length > 0;
	const elevatedProcesses = processes.filter((p) => p.elevated);
	const hasElevated = elevatedProcesses.length > 0;

	logger.log(
		"debug",
		`isProcessRunningWithElevation: '${processName}' - Running: ${isRunning}, ` +
			`Total: ${processes.length}, Elevated: ${elevatedProcesses.length}`,
	);

	return {
		isRunning,
		hasElevated,
		processCount: processes.length,
		elevatedCount: elevatedProcesses.length,
	};
}

export async function waitForProcessToStart(
	processName: string,
	checkIntervalMs = 500,
): Promise<number | null> {
	logger.log(
		"debug",
		`waitForProcessToStart: Waiting indefinitely for '${processName}' (check every ${checkIntervalMs}ms).`,
	);

	while (true) {
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
		await new Promise((resolve) => setTimeout(resolve, checkIntervalMs));
	}
}

export async function waitForProcessToStartWithOptions(
	processName: string,
	options: {
		checkIntervalMs?: number;
		requireElevated?: boolean;
	} = {},
): Promise<ProcessInfo | null> {
	const { checkIntervalMs = 500, requireElevated = false } = options;

	logger.log(
		"debug",
		`waitForProcessToStartWithOptions: Waiting indefinitely for '${processName}' ` +
			`(elevated: ${requireElevated})`,
	);

	while (true) {
		const processes = await findProcessInfoByName(processName);

		const targetProcesses = requireElevated
			? processes.filter((p) => p.elevated)
			: processes;

		if (targetProcesses.length > 0) {
			const foundProcess = targetProcesses[0];
			logger.log(
				"info",
				`waitForProcessToStartWithOptions: Process '${processName}' detected - ` +
					`PID: ${foundProcess.pid}, Elevated: ${foundProcess.elevated}`,
			);
			return foundProcess;
		}

		await new Promise((resolve) => setTimeout(resolve, checkIntervalMs));
	}
}
