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

/**
 * Extended spawn options with admin privilege support
 */
interface ExtendedSpawnOptions extends SpawnOptions {
	/** Whether to run the process with administrator privileges */
	runAsAdmin?: boolean;
}

/**
 * Result of a process spawn operation
 */
interface SpawnResult {
	/** The spawned child process (null for admin processes) */
	process: ChildProcess | null;
	/** Name of the process */
	processName: string;
	/** Whether the process requires polling for status checks */
	requiresPolling: boolean;
}

/**
 * Information about a running process
 */
interface ProcessInfo {
	/** Process ID */
	pid: number;
	/** Process name */
	name: string;
	/** Whether the process is running with elevated privileges */
	elevated?: boolean;
}

/**
 * Cached process information with validation metadata
 */
interface CachedProcess {
	/** Process ID */
	pid: number;
	/** Process name */
	name: string;
	/** Whether the process is running with elevated privileges */
	elevated: boolean;
	/** Timestamp of last validation check */
	lastChecked: number;
	/** Whether the cached entry is still valid */
	isValid: boolean;
}

/**
 * Cache storage for process information by process name
 */
interface ProcessCache {
	[processName: string]: CachedProcess[];
}

/**
 * Configuration options for process waiting operations
 */
interface WaitForProcessOptions {
	/** Interval between checks in milliseconds */
	checkIntervalMs?: number;
	/** Whether to require elevated privileges */
	requireElevated?: boolean;
	/** Maximum number of attempts before giving up */
	maxAttempts?: number;
}

/**
 * Result of process elevation check
 */
interface ProcessElevationResult {
	/** Whether any process is running */
	isRunning: boolean;
	/** Whether any elevated process is running */
	hasElevated: boolean;
	/** Total number of processes found */
	processCount: number;
	/** Number of elevated processes found */
	elevatedCount: number;
}

/**
 * Error types for process operations
 */
enum ProcessError {
	SPAWN_FAILED = "SPAWN_FAILED",
	PROCESS_NOT_FOUND = "PROCESS_NOT_FOUND",
	TIMEOUT = "TIMEOUT",
	PERMISSION_DENIED = "PERMISSION_DENIED",
	INVALID_COMMAND = "INVALID_COMMAND",
}

/**
 * Custom error class for process operations
 */
class ProcessOperationError extends Error {
	constructor(
		public readonly errorType: ProcessError,
		message: string,
		public readonly details?: Record<string, unknown>,
	) {
		super(message);
		this.name = "ProcessOperationError";
	}
}

// Module cleanup on process exit
process.on("exit", cleanup);
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

/**
 * Export summary:
 *
 * Core Functions:
 * - safeSpawn: Safe process spawning with admin privilege handling
 * - isProcessRunning: Fast process detection with caching
 * - isProcessRunningWithElevation: Process detection with elevation info
 * - waitForProcessToStart: Wait for process with timeout
 * - waitForProcessToStartWithOptions: Advanced waiting with options
 * - waitForPidToTerminate: Wait for specific PID termination
 *
 * Process Discovery:
 * - findProcessByName: Find PIDs by process name
 * - findProcessInfoByName: Find detailed process information
 * - isSpecificPidRunning: Check if specific PID is running
 *
 * Cache Management:
 * - clearProcessCache: Clear process cache
 * - getCacheStats: Get cache statistics
 *
 * Advanced Monitoring:
 * - ProcessMonitor: High-performance continuous monitoring
 * - globalProcessMonitor: Global monitor instance
 *
 * Error Handling:
 * - ProcessOperationError: Custom error class
 * - ProcessError: Error type enumeration
 *
 * All functions include comprehensive error handling, input validation,
 * and detailed logging for production use.
 */

const execPromise = util.promisify(exec);

/**
 * Configuration object for process management
 */
const ProcessConfig = {
	/** Cache time-to-live in milliseconds */
	CACHE_TTL: 2000,
	/** Interval for PID validity checks in milliseconds */
	PID_CHECK_INTERVAL: 500,
	/** Interval for cache cleanup in milliseconds */
	CACHE_CLEANUP_INTERVAL: 30000,
	/** Default timeout for command execution in milliseconds */
	DEFAULT_COMMAND_TIMEOUT: 5000,
	/** Default check interval for process waiting in milliseconds */
	DEFAULT_WAIT_INTERVAL: 500,
	/** Default maximum attempts for process waiting */
	DEFAULT_MAX_ATTEMPTS: 60,
	/** Multiplier for cache retention during cleanup */
	CACHE_RETENTION_MULTIPLIER: 5,
} as const;

// Process cache to avoid repeated expensive lookups
const processCache: ProcessCache = {};

/**
 * Validates the process configuration on module load
 */
function validateConfig(): void {
	const config = ProcessConfig;
	if (config.CACHE_TTL <= 0 || config.PID_CHECK_INTERVAL <= 0) {
		throw new ProcessOperationError(
			ProcessError.INVALID_COMMAND,
			"Invalid process configuration: intervals must be positive",
			{ config },
		);
	}
}

// Validate configuration on module initialization
validateConfig();

/**
 * Performs periodic cache cleanup to prevent memory leaks
 */
function performCacheCleanup(): void {
	try {
		const now = Date.now();
		const retentionTime =
			ProcessConfig.CACHE_TTL * ProcessConfig.CACHE_RETENTION_MULTIPLIER;
		let cleanedEntries = 0;
		let cleanedProcesses = 0;

		for (const processName in processCache) {
			const originalLength = processCache[processName].length;
			processCache[processName] = processCache[processName].filter(
				(p) => now - p.lastChecked < retentionTime,
			);

			const removedEntries = originalLength - processCache[processName].length;
			cleanedEntries += removedEntries;

			if (processCache[processName].length === 0) {
				delete processCache[processName];
				cleanedProcesses++;
			}
		}

		if (cleanedEntries > 0 || cleanedProcesses > 0) {
			logger.log(
				"debug",
				`Cache cleanup: removed ${cleanedEntries} entries and ${cleanedProcesses} process types`,
			);
		}
	} catch (error) {
		logger.log("error", `Cache cleanup failed: ${(error as Error).message}`);
	}
}

// Periodic cache cleanup to prevent memory leaks
const cacheCleanupInterval = setInterval(
	performCacheCleanup,
	ProcessConfig.CACHE_CLEANUP_INTERVAL,
);

/**
 * Cleanup function to be called when the module is being unloaded
 */
export function cleanup(): void {
	clearInterval(cacheCleanupInterval);
	for (const key in processCache) {
		delete processCache[key];
	}
	logger.log("debug", "Process spawning module cleanup completed");
}

/**
 * Safely spawns a process with comprehensive error handling and logging
 *
 * @param command - The command to execute
 * @param args - Arguments to pass to the command
 * @param options - Extended spawn options including admin privilege support
 * @returns SpawnResult containing process information and metadata
 * @throws ProcessOperationError for invalid inputs or spawn failures
 */
export function safeSpawn(
	command: string,
	args: string[] = [],
	options: ExtendedSpawnOptions = {},
): SpawnResult {
	// Input validation
	if (!command || typeof command !== "string" || command.trim().length === 0) {
		throw new ProcessOperationError(
			ProcessError.INVALID_COMMAND,
			"Command must be a non-empty string",
			{ command, args, options },
		);
	}

	if (!Array.isArray(args)) {
		throw new ProcessOperationError(
			ProcessError.INVALID_COMMAND,
			"Arguments must be an array",
			{ command, args, options },
		);
	}

	const platform = os.platform();
	const processName = path.basename(command, path.extname(command));

	logger.log(
		"debug",
		`safeSpawn: Command: '${command}', Args: [${args.join(", ")}], Platform: ${platform}, Options: ${JSON.stringify(options)}`,
	);

	try {
		if (options.runAsAdmin) {
			logger.log(
				"info",
				`Attempting to run as admin on ${platform} using @expo/sudo-prompt`,
			);
			return handleSudoPromptLaunch(command, args, processName);
		}

		return spawnNonAdmin(command, args, options, processName);
	} catch (error) {
		logger.log(
			"error",
			`safeSpawn failed for command '${command}': ${(error as Error).message}`,
		);

		if (error instanceof ProcessOperationError) {
			throw error;
		}

		throw new ProcessOperationError(
			ProcessError.SPAWN_FAILED,
			`Failed to spawn process: ${(error as Error).message}`,
			{ command, args, options, originalError: error },
		);
	}
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
	verbose = true,
): Promise<ProcessInfo[]> {
	const platform = os.platform();
	const allProcesses: ProcessInfo[] = [];
	const namesToTry = generateProcessNamePermutations(processName);

	if (verbose) {
		logger.log(
			"debug",
			`findProcessesByNameRobust: Searching for '${processName}' on ${platform}`,
		);
	}

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
				if (verbose) {
					logger.log(
						"debug",
						`Standard method failed for '${name}': ${(error as Error).message}`,
					);
				}
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
					if (verbose) {
						logger.log(
							"debug",
							`PowerShell method failed for '${name}': ${(error as Error).message}`,
						);
					}
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
					if (verbose) {
						logger.log(
							"debug",
							`Alternative WMIC method failed for '${name}': ${(error as Error).message}`,
						);
					}
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
				if (verbose) {
					logger.log(
						"debug",
						`Unix method failed for '${name}': ${(error as Error).message}`,
					);
				}
			}
		}
	}

	const uniqueProcesses = allProcesses
		.filter(
			(process, index, self) =>
				index === self.findIndex((p) => p.pid === process.pid),
		)
		.sort((a, b) => a.pid - b.pid);

	if (verbose) {
		logger.log(
			"debug",
			`findProcessesByNameRobust: Found ${uniqueProcesses.length} unique processes for '${processName}'`,
		);
	}
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

// Efficient PID validation functions
async function isPidRunning(pid: number): Promise<boolean> {
	const platform = os.platform();

	try {
		if (platform === "win32") {
			const command = `tasklist /FI "PID eq ${pid}" /FO CSV /NH`;
			const { stdout } = await execPromise(command, { timeout: 1000 });
			return stdout.trim().length > 0 && !stdout.includes("INFO: No tasks");
		}
		// Unix-like systems
		const command = `kill -0 ${pid} 2>/dev/null`;
		await execPromise(command, { timeout: 1000 });
		return true; // If no error, process exists
	} catch {
		return false; // Process doesn't exist or error occurred
	}
}

/**
 * Validates cached processes by checking if their PIDs are still running
 *
 * @param processName - Name of the process to validate
 * @returns Array of valid cached processes
 */
async function validateCachedProcesses(
	processName: string,
): Promise<CachedProcess[]> {
	if (!processName || typeof processName !== "string") {
		return [];
	}

	const cached = processCache[processName] || [];
	const now = Date.now();
	const validProcesses: CachedProcess[] = [];

	for (const process of cached) {
		try {
			// Check if we need to validate this PID
			if (now - process.lastChecked > ProcessConfig.PID_CHECK_INTERVAL) {
				process.isValid = await isPidRunning(process.pid);
				process.lastChecked = now;
			}

			if (process.isValid) {
				validProcesses.push(process);
			}
		} catch (error) {
			logger.log(
				"debug",
				`Failed to validate cached PID ${process.pid} for '${processName}': ${(error as Error).message}`,
			);
			// Mark as invalid on error
			process.isValid = false;
		}
	}

	processCache[processName] = validProcesses;
	return validProcesses;
}

function updateProcessCache(
	processName: string,
	processes: ProcessInfo[],
): void {
	const now = Date.now();
	processCache[processName] = processes.map((p) => ({
		pid: p.pid,
		name: p.name,
		elevated: p.elevated || false,
		lastChecked: now,
		isValid: true,
	}));
}

export async function findProcessByName(
	processName: string,
	verbose = true,
): Promise<number[]> {
	if (verbose) {
		logger.log("debug", `findProcessByName: Searching for '${processName}'`);
	}

	try {
		// First, check and validate cached processes
		const cachedProcesses = await validateCachedProcesses(processName);
		const now = Date.now();

		// If we have valid cached processes and cache is still fresh, use them
		if (cachedProcesses.length > 0) {
			const oldestCache = Math.min(
				...cachedProcesses.map((p) => p.lastChecked),
			);
			if (now - oldestCache < ProcessConfig.CACHE_TTL) {
				const pids = cachedProcesses.map((p) => p.pid);
				if (verbose) {
					logger.log(
						"debug",
						`findProcessByName: Using cached PIDs: [${pids.join(", ")}]`,
					);
				}
				return pids;
			}
		}

		// Cache miss or expired, do full search
		const processes = await findProcessesByNameRobust(processName, verbose);
		const pids = processes.map((p) => p.pid);

		// Update cache with new results
		updateProcessCache(processName, processes);

		if (verbose) {
			logger.log(
				"debug",
				`findProcessByName: Found PIDs: [${pids.join(", ")}]`,
			);
		}

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
		// First, check and validate cached processes
		const cachedProcesses = await validateCachedProcesses(processName);
		const now = Date.now();

		// If we have valid cached processes and cache is still fresh, use them
		if (cachedProcesses.length > 0) {
			const oldestCache = Math.min(
				...cachedProcesses.map((p) => p.lastChecked),
			);
			if (now - oldestCache < ProcessConfig.CACHE_TTL) {
				const processes = cachedProcesses.map((p) => ({
					pid: p.pid,
					name: p.name,
					elevated: p.elevated,
				}));
				logger.log(
					"debug",
					`findProcessInfoByName: Using cached processes: ${processes.length}`,
				);
				return processes;
			}
		}

		// Cache miss or expired, do full search
		const processes = await findProcessesByNameRobust(processName);

		// Update cache with new results
		updateProcessCache(processName, processes);

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

// Fast PID-specific check without full process search
export async function isSpecificPidRunning(pid: number): Promise<boolean> {
	logger.log("debug", `isSpecificPidRunning: Checking PID ${pid}`);
	const isRunning = await isPidRunning(pid);
	logger.log(
		"debug",
		`isSpecificPidRunning: PID ${pid} is running: ${isRunning}`,
	);
	return isRunning;
}

// Efficient function to wait for a specific PID to terminate
export async function waitForPidToTerminate(
	pid: number,
	checkIntervalMs = 500,
	maxAttempts = 120, // 60 seconds with 500ms intervals
): Promise<boolean> {
	logger.log(
		"debug",
		`waitForPidToTerminate: Waiting for PID ${pid} to terminate (max ${maxAttempts} attempts)`,
	);

	let attempts = 0;
	while (attempts < maxAttempts) {
		const isRunning = await isPidRunning(pid);
		if (!isRunning) {
			logger.log(
				"info",
				`waitForPidToTerminate: PID ${pid} terminated after ${attempts + 1} attempts`,
			);
			return true;
		}

		attempts++;
		if (attempts < maxAttempts) {
			await new Promise((resolve) => setTimeout(resolve, checkIntervalMs));
		}
	}

	logger.log(
		"warn",
		`waitForPidToTerminate: PID ${pid} still running after ${maxAttempts} attempts`,
	);
	return false;
}

// Cache management utilities
/**
 * Clears the process cache for a specific process or all processes
 *
 * @param processName - Optional process name to clear. If not provided, clears entire cache
 * @remarks This will force subsequent process checks to perform full searches
 */
export function clearProcessCache(processName?: string): void {
	if (processName) {
		delete processCache[processName];
		logger.log(
			"debug",
			`clearProcessCache: Cleared cache for '${processName}'`,
		);
	} else {
		for (const key in processCache) {
			delete processCache[key];
		}
		logger.log("debug", "clearProcessCache: Cleared entire process cache");
	}
}

/**
 * Gets statistics about the current process cache
 *
 * @returns Object containing cache statistics
 */
export function getCacheStats(): {
	totalEntries: number;
	processNames: string[];
	totalCachedPids: number;
} {
	const processNames = Object.keys(processCache);
	const totalCachedPids = processNames.reduce(
		(sum, name) => sum + processCache[name].length,
		0,
	);

	return {
		totalEntries: processNames.length,
		processNames,
		totalCachedPids,
	};
}

// High-performance process monitor class for continuous monitoring
export class ProcessMonitor {
	private monitoredPids: Set<number> = new Set();
	private monitorInterval: NodeJS.Timeout | null = null;
	private callbacks: Map<number, (isRunning: boolean) => void> = new Map();
	private checkIntervalMs: number;

	constructor(checkIntervalMs = 1000) {
		this.checkIntervalMs = checkIntervalMs;
	}

	// Add a PID to monitor with a callback
	addPid(pid: number, callback: (isRunning: boolean) => void): void {
		this.monitoredPids.add(pid);
		this.callbacks.set(pid, callback);
		logger.log("debug", `ProcessMonitor: Added PID ${pid} to monitoring`);

		if (!this.monitorInterval) {
			this.startMonitoring();
		}
	}

	// Remove a PID from monitoring
	removePid(pid: number): void {
		this.monitoredPids.delete(pid);
		this.callbacks.delete(pid);
		logger.log("debug", `ProcessMonitor: Removed PID ${pid} from monitoring`);

		if (this.monitoredPids.size === 0) {
			this.stopMonitoring();
		}
	}

	// Start the monitoring loop
	private startMonitoring(): void {
		logger.log("debug", "ProcessMonitor: Starting monitoring loop");
		this.monitorInterval = setInterval(async () => {
			const pidsToCheck = Array.from(this.monitoredPids);

			for (const pid of pidsToCheck) {
				try {
					const isRunning = await isPidRunning(pid);
					const callback = this.callbacks.get(pid);

					if (callback) {
						callback(isRunning);
					}

					// Auto-remove terminated processes
					if (!isRunning) {
						this.removePid(pid);
					}
				} catch (error) {
					logger.log(
						"error",
						`ProcessMonitor: Error checking PID ${pid}: ${(error as Error).message}`,
					);
					this.removePid(pid);
				}
			}
		}, this.checkIntervalMs);
	}

	// Stop the monitoring loop
	private stopMonitoring(): void {
		if (this.monitorInterval) {
			logger.log("debug", "ProcessMonitor: Stopping monitoring loop");
			clearInterval(this.monitorInterval);
			this.monitorInterval = null;
		}
	}

	// Clean up all monitoring
	destroy(): void {
		this.stopMonitoring();
		this.monitoredPids.clear();
		this.callbacks.clear();
		logger.log("debug", "ProcessMonitor: Destroyed");
	}

	// Get current monitoring stats
	getStats(): { monitoredCount: number; pids: number[] } {
		return {
			monitoredCount: this.monitoredPids.size,
			pids: Array.from(this.monitoredPids),
		};
	}
}

// Global process monitor instance for convenience
export const globalProcessMonitor = new ProcessMonitor();

/**
 * Checks if a process is currently running
 *
 * @param processName - Name of the process to check
 * @returns Promise that resolves to true if process is running, false otherwise
 * @throws ProcessOperationError for invalid process names
 */
export async function isProcessRunning(
	processName: string,
	verbose = true,
): Promise<boolean> {
	if (
		!processName ||
		typeof processName !== "string" ||
		processName.trim().length === 0
	) {
		throw new ProcessOperationError(
			ProcessError.INVALID_COMMAND,
			"Process name must be a non-empty string",
			{ processName },
		);
	}

	logger.log("debug", `isProcessRunning: Checking for '${processName}'`);

	try {
		// Try cache first for faster response
		const cachedProcesses = await validateCachedProcesses(processName);
		if (cachedProcesses.length > 0) {
			logger.log(
				"debug",
				`isProcessRunning: '${processName}' found in cache: true`,
			);
			return true;
		}

		// Fallback to full search if not in cache
		const pids = await findProcessByName(processName, verbose);
		const isRunning = pids.length > 0;
		logger.log(
			"debug",
			`isProcessRunning: '${processName}' is running: ${isRunning} (Found PIDs: ${pids.length})`,
		);
		return isRunning;
	} catch (error) {
		logger.log(
			"error",
			`isProcessRunning failed for '${processName}': ${(error as Error).message}`,
		);

		if (error instanceof ProcessOperationError) {
			throw error;
		}

		throw new ProcessOperationError(
			ProcessError.PROCESS_NOT_FOUND,
			`Failed to check if process is running: ${(error as Error).message}`,
			{ processName, originalError: error },
		);
	}
}

/**
 * Checks if a process is running and provides elevation information
 *
 * @param processName - Name of the process to check
 * @returns ProcessElevationResult with detailed process information
 * @throws ProcessOperationError for invalid process names
 */
export async function isProcessRunningWithElevation(
	processName: string,
): Promise<ProcessElevationResult> {
	if (
		!processName ||
		typeof processName !== "string" ||
		processName.trim().length === 0
	) {
		throw new ProcessOperationError(
			ProcessError.INVALID_COMMAND,
			"Process name must be a non-empty string",
			{ processName },
		);
	}

	logger.log(
		"debug",
		`isProcessRunningWithElevation: Checking for '${processName}'`,
	);

	try {
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
	} catch (error) {
		logger.log(
			"error",
			`isProcessRunningWithElevation failed for '${processName}': ${(error as Error).message}`,
		);

		if (error instanceof ProcessOperationError) {
			throw error;
		}

		throw new ProcessOperationError(
			ProcessError.PROCESS_NOT_FOUND,
			`Failed to check process elevation: ${(error as Error).message}`,
			{ processName, originalError: error },
		);
	}
}

/**
 * Waits for a process to start and returns its PID
 *
 * @param processName - Name of the process to wait for
 * @param checkIntervalMs - Interval between checks in milliseconds
 * @param maxAttempts - Maximum number of attempts before giving up
 * @returns Promise that resolves to PID if found, null if timeout
 * @throws ProcessOperationError for invalid parameters
 */
export async function waitForProcessToStart(
	processName: string,
	checkIntervalMs: number = ProcessConfig.DEFAULT_WAIT_INTERVAL,
	maxAttempts: number = ProcessConfig.DEFAULT_MAX_ATTEMPTS,
	verbose = true,
): Promise<number | null> {
	if (
		!processName ||
		typeof processName !== "string" ||
		processName.trim().length === 0
	) {
		throw new ProcessOperationError(
			ProcessError.INVALID_COMMAND,
			"Process name must be a non-empty string",
			{ processName },
		);
	}

	if (checkIntervalMs <= 0 || !Number.isFinite(checkIntervalMs)) {
		throw new ProcessOperationError(
			ProcessError.INVALID_COMMAND,
			"Check interval must be a positive finite number",
			{ checkIntervalMs },
		);
	}

	if (maxAttempts <= 0 || !Number.isInteger(maxAttempts)) {
		throw new ProcessOperationError(
			ProcessError.INVALID_COMMAND,
			"Max attempts must be a positive integer",
			{ maxAttempts },
		);
	}

	logger.log(
		"debug",
		`waitForProcessToStart: Waiting for '${processName}' (max ${maxAttempts} attempts, ${checkIntervalMs}ms intervals).`,
	);

	try {
		let attempts = 0;
		while (attempts < maxAttempts) {
			// First check cache for faster response
			const cachedProcesses = await validateCachedProcesses(processName);
			if (cachedProcesses.length > 0) {
				const pid = cachedProcesses[0].pid;
				logger.log(
					"info",
					`waitForProcessToStart: Process '${processName}' found in cache with PID: ${pid} after ${attempts + 1} attempts`,
				);
				return pid;
			}

			// Fallback to full search
			const pids = await findProcessByName(processName, verbose);
			if (pids.length > 0) {
				logger.log(
					"info",
					`waitForProcessToStart: Process '${processName}' detected with PID: ${pids[0]} after ${attempts + 1} attempts`,
				);
				return pids[0];
			}

			attempts++;
			if (attempts < maxAttempts) {
				logger.log(
					"debug",
					`waitForProcessToStart: Process '${processName}' not found (attempt ${attempts}/${maxAttempts}). Retrying in ${checkIntervalMs}ms...`,
				);
				await new Promise((resolve) => setTimeout(resolve, checkIntervalMs));
			}
		}

		logger.log(
			"warn",
			`waitForProcessToStart: Process '${processName}' not found after ${maxAttempts} attempts. Giving up.`,
		);
		return null;
	} catch (error) {
		logger.log(
			"error",
			`waitForProcessToStart failed for '${processName}': ${(error as Error).message}`,
		);

		if (error instanceof ProcessOperationError) {
			throw error;
		}

		throw new ProcessOperationError(
			ProcessError.PROCESS_NOT_FOUND,
			`Failed to wait for process: ${(error as Error).message}`,
			{ processName, checkIntervalMs, maxAttempts, originalError: error },
		);
	}
}

/**
 * Waits for a process to start with advanced options
 *
 * @param processName - Name of the process to wait for
 * @param options - Configuration options for waiting
 * @returns Promise that resolves to ProcessInfo if found, null if timeout
 * @throws ProcessOperationError for invalid parameters
 */
export async function waitForProcessToStartWithOptions(
	processName: string,
	options: WaitForProcessOptions = {},
): Promise<ProcessInfo | null> {
	if (
		!processName ||
		typeof processName !== "string" ||
		processName.trim().length === 0
	) {
		throw new ProcessOperationError(
			ProcessError.INVALID_COMMAND,
			"Process name must be a non-empty string",
			{ processName },
		);
	}

	const {
		checkIntervalMs = ProcessConfig.DEFAULT_WAIT_INTERVAL,
		requireElevated = false,
		maxAttempts = ProcessConfig.DEFAULT_MAX_ATTEMPTS,
	} = options;

	if (checkIntervalMs <= 0 || !Number.isFinite(checkIntervalMs)) {
		throw new ProcessOperationError(
			ProcessError.INVALID_COMMAND,
			"Check interval must be a positive finite number",
			{ checkIntervalMs },
		);
	}

	if (maxAttempts <= 0 || !Number.isInteger(maxAttempts)) {
		throw new ProcessOperationError(
			ProcessError.INVALID_COMMAND,
			"Max attempts must be a positive integer",
			{ maxAttempts },
		);
	}

	logger.log(
		"debug",
		`waitForProcessToStartWithOptions: Waiting for '${processName}' ` +
			`(elevated: ${requireElevated}, max ${maxAttempts} attempts)`,
	);

	try {
		let attempts = 0;
		while (attempts < maxAttempts) {
			const processes = await findProcessInfoByName(processName);

			const targetProcesses = requireElevated
				? processes.filter((p) => p.elevated)
				: processes;

			if (targetProcesses.length > 0) {
				const foundProcess = targetProcesses[0];
				logger.log(
					"info",
					`waitForProcessToStartWithOptions: Process '${processName}' detected - ` +
						`PID: ${foundProcess.pid}, Elevated: ${foundProcess.elevated} after ${attempts + 1} attempts`,
				);
				return foundProcess;
			}

			attempts++;
			if (attempts < maxAttempts) {
				await new Promise((resolve) => setTimeout(resolve, checkIntervalMs));
			}
		}

		logger.log(
			"warn",
			`waitForProcessToStartWithOptions: Process '${processName}' not found after ${maxAttempts} attempts. Giving up.`,
		);
		return null;
	} catch (error) {
		logger.log(
			"error",
			`waitForProcessToStartWithOptions failed for '${processName}': ${(error as Error).message}`,
		);

		if (error instanceof ProcessOperationError) {
			throw error;
		}

		throw new ProcessOperationError(
			ProcessError.PROCESS_NOT_FOUND,
			`Failed to wait for process with options: ${(error as Error).message}`,
			{ processName, options, originalError: error },
		);
	}
}
