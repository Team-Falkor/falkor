import * as fs from "node:fs";
import type { LogEntry, LoggerFilterOptions, LogLevel } from "@/@types";
import { constants } from "../../utils/constants";
import { JsonFileEditor } from "../json/jsonFileEditor";

/**
 * Error class for Logger-specific errors
 */
class LoggerError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "LoggerError";
	}
}

class Logger {
	private logsPath = constants.logsPath;
	private jsonFileEditor: JsonFileEditor<Array<LogEntry>>;
	private logs: Array<LogEntry> = [];
	private writeBuffer: Array<LogEntry> = [];
	private bufferSize = 10; // Number of logs to buffer before writing to disk
	private maxLogsInMemory = 1000; // Maximum number of logs to keep in memory
	private maxLogFileSize = 5 * 1024 * 1024; // 5MB max log file size
	private writeTimer: NodeJS.Timeout | null = null;
	private flushInterval = 5000; // Flush logs every 5 seconds
	private isWriting = false;
	private rotationCount = 0;
	private maxRotationFiles = 5; // Maximum number of rotation files to keep
	private static instance: Logger;

	private constructor() {
		this.jsonFileEditor = new JsonFileEditor<Array<LogEntry>>({
			filePath: this.logsPath,
			defaultContent: [],
			createDirs: false,
			verbose: true,
		});

		// Load existing logs
		this.logs = this.jsonFileEditor.read() || [];

		// Check if log rotation is needed on startup
		this.checkLogRotation();

		// Start periodic flush timer
		this.startFlushTimer();
	}

	/**
	 * Starts the timer to periodically flush logs to disk
	 */
	private startFlushTimer(): void {
		if (this.writeTimer) {
			clearInterval(this.writeTimer);
		}

		this.writeTimer = setInterval(() => {
			this.flushLogs();
		}, this.flushInterval);
	}

	/**
	 * Stops the flush timer
	 */
	private stopFlushTimer(): void {
		if (this.writeTimer) {
			clearInterval(this.writeTimer);
			this.writeTimer = null;
		}
	}

	/**
	 * Flushes buffered logs to disk
	 */
	private async flushLogs(): Promise<void> {
		if (this.isWriting || this.writeBuffer.length === 0) {
			return;
		}

		try {
			this.isWriting = true;

			// Create a copy of the buffer and clear it
			const logsToWrite = [...this.writeBuffer];
			this.writeBuffer = [];

			// Merge with existing logs and write to disk
			this.logs = [...this.logs, ...logsToWrite];

			// Trim logs if they exceed the maximum memory limit
			if (this.logs.length > this.maxLogsInMemory) {
				this.logs = this.logs.slice(-this.maxLogsInMemory);
			}

			// Write to disk
			this.jsonFileEditor.write(this.logs);

			// Check if log rotation is needed
			await this.checkLogRotation();
		} catch (error) {
			console.error("Error flushing logs:", error);
			// Put logs back in the buffer to try again later
			this.writeBuffer = [
				...this.writeBuffer,
				...this.logs.slice(-this.writeBuffer.length),
			];
		} finally {
			this.isWriting = false;
		}
	}

	/**
	 * Checks if log rotation is needed and performs rotation if necessary
	 */
	private async checkLogRotation(): Promise<void> {
		try {
			if (!fs.existsSync(this.logsPath)) {
				return;
			}

			const stats = fs.statSync(this.logsPath);
			if (stats.size >= this.maxLogFileSize) {
				await this.rotateLogFile();
			}
		} catch (error) {
			console.error("Error checking log rotation:", error);
		}
	}

	/**
	 * Rotates the log file by creating a backup and starting a new log file
	 */
	private async rotateLogFile(): Promise<void> {
		try {
			// Clean up old rotation files if we have too many
			for (let i = this.maxRotationFiles; i > 0; i--) {
				const oldPath = `${this.logsPath}.${i}`;
				if (fs.existsSync(oldPath)) {
					if (i === this.maxRotationFiles) {
						fs.unlinkSync(oldPath);
					} else {
						const newPath = `${this.logsPath}.${i + 1}`;
						fs.renameSync(oldPath, newPath);
					}
				}
			}

			// Rename current log file to .1
			if (fs.existsSync(this.logsPath)) {
				fs.renameSync(this.logsPath, `${this.logsPath}.1`);
			}

			// Create a new empty log file
			this.jsonFileEditor.write([]);
			this.logs = [];
			this.rotationCount++;
		} catch (error) {
			console.error("Error rotating log file:", error);
			throw new LoggerError(
				`Failed to rotate log file: ${(error as Error).message}`,
			);
		}
	}

	/**
	 * Logs a message with the specified level
	 * @param level The log level
	 * @param message The message to log
	 * @returns The created log entry or null if an error occurred
	 */
	public log(level: LogLevel, message: string): LogEntry | null {
		try {
			const timestamp = Date.now();
			const log: LogEntry = { level, message, timestamp };

			// Add to buffer
			this.writeBuffer.push(log);

			// Flush immediately if buffer size is reached
			if (this.writeBuffer.length >= this.bufferSize) {
				this.flushLogs();
			}

			console.log(`[${level}] ${message}`);
			return log;
		} catch (error) {
			console.error("Error logging:", error);
			return null;
		}
	}

	/**
	 * Convenience method for logging error messages
	 * @param message The error message to log
	 * @returns The created log entry or null if an error occurred
	 */
	public error(message: string): LogEntry | null {
		return this.log("error", message);
	}

	/**
	 * Convenience method for logging warning messages
	 * @param message The warning message to log
	 * @returns The created log entry or null if an error occurred
	 */
	public warn(message: string): LogEntry | null {
		return this.log("warn", message);
	}

	/**
	 * Convenience method for logging info messages
	 * @param message The info message to log
	 * @returns The created log entry or null if an error occurred
	 */
	public info(message: string): LogEntry | null {
		return this.log("info", message);
	}

	/**
	 * Convenience method for logging debug messages
	 * @param message The debug message to log
	 * @returns The created log entry or null if an error occurred
	 */
	public debug(message: string): LogEntry | null {
		return this.log("debug", message);
	}

	/**
	 * Convenience method for logging trace messages
	 * @param message The trace message to log
	 * @returns The created log entry or null if an error occurred
	 */
	public trace(message: string): LogEntry | null {
		return this.log("trace", message);
	}

	/**
	 * Clears all logs
	 */
	public async clear(): Promise<void> {
		try {
			// Stop any pending writes
			if (this.isWriting) {
				await new Promise((resolve) => setTimeout(resolve, 100));
			}

			this.logs = [];
			this.writeBuffer = [];
			this.jsonFileEditor.write([]);
		} catch (error) {
			console.error("Error clearing logs:", error);
			throw new LoggerError(
				`Failed to clear logs: ${(error as Error).message}`,
			);
		}
	}

	/**
	 * Reads all logs from disk
	 * @returns Array of log entries
	 */
	public read(): Array<LogEntry> {
		try {
			// Flush any pending logs first
			if (this.writeBuffer.length > 0) {
				this.flushLogs();
			}

			const logs = this.jsonFileEditor.read();
			if (!logs?.length) return [];

			this.logs = logs;
			return logs;
		} catch (error) {
			console.error("Error reading logs:", error);
			return [];
		}
	}

	/**
	 * Removes a log entry by timestamp
	 * @param timestamp The timestamp of the log entry to remove
	 */
	public async remove(timestamp: number): Promise<void> {
		try {
			// Flush any pending logs first
			if (this.writeBuffer.length > 0) {
				await this.flushLogs();
			}

			const logs = this.jsonFileEditor.read();
			if (!logs) return;

			const filteredLogs = logs.filter((log) => log.timestamp !== timestamp);
			this.logs = filteredLogs;
			this.jsonFileEditor.write(filteredLogs);
		} catch (error) {
			console.error("Error removing log:", error);
			throw new LoggerError(
				`Failed to remove log: ${(error as Error).message}`,
			);
		}
	}

	/**
	 * Filters logs based on provided options
	 * @param options Filter options including date and level
	 * @returns Filtered array of log entries
	 */
	public filter(options: LoggerFilterOptions): Array<LogEntry> {
		try {
			const { date, level } = options;
			const filteredLogs = this.logs.filter((log) => {
				const logDate = new Date(log.timestamp);
				return (
					(!date || logDate.toDateString() === date.toDateString()) &&
					(!level || log.level === level)
				);
			});
			return filteredLogs;
		} catch (error) {
			console.error("Error filtering logs:", error);
			return [];
		}
	}

	/**
	 * Advanced filtering with multiple criteria
	 * @param options Advanced filter options
	 * @returns Filtered array of log entries
	 */
	public advancedFilter(options: {
		startDate?: Date;
		endDate?: Date;
		levels?: LogLevel[];
		searchText?: string;
	}): Array<LogEntry> {
		try {
			const { startDate, endDate, levels, searchText } = options;

			return this.logs.filter((log) => {
				const logDate = new Date(log.timestamp);

				// Check date range
				if (startDate && logDate < startDate) return false;
				if (endDate && logDate > endDate) return false;

				// Check log levels
				if (levels && levels.length > 0 && !levels.includes(log.level))
					return false;

				// Check search text
				if (
					searchText &&
					!log.message.toLowerCase().includes(searchText.toLowerCase())
				)
					return false;

				return true;
			});
		} catch (error) {
			console.error("Error in advanced filtering:", error);
			return [];
		}
	}

	/**
	 * Gets all unique dates that have log entries
	 * @param includeTime Whether to include time in the returned dates
	 * @returns Array of unique date strings
	 */
	public getLoggedDates(includeTime?: boolean): string[] {
		try {
			const dates = this.logs.map((log) => {
				const logDate = new Date(log.timestamp);
				return includeTime
					? `${logDate.toDateString()} ${logDate.toLocaleTimeString()}`
					: logDate.toDateString();
			});
			return Array.from(new Set(dates));
		} catch (error) {
			console.error("Error getting logged dates:", error);
			return [];
		}
	}

	/**
	 * Gets log statistics
	 * @returns Statistics about the logs
	 */
	public getStats(): {
		totalLogs: number;
		byLevel: Record<LogLevel, number>;
		oldestLog?: Date;
		newestLog?: Date;
		rotationCount: number;
	} {
		try {
			const byLevel: Record<LogLevel, number> = {
				error: 0,
				warn: 0,
				info: 0,
				debug: 0,
				trace: 0,
			};

			let oldestTimestamp: number | undefined;
			let newestTimestamp: number | undefined;

			for (const log of this.logs) {
				// Count by level
				byLevel[log.level]++;

				// Track oldest and newest
				if (!oldestTimestamp || log.timestamp < oldestTimestamp) {
					oldestTimestamp = log.timestamp;
				}
				if (!newestTimestamp || log.timestamp > newestTimestamp) {
					newestTimestamp = log.timestamp;
				}
			}

			return {
				totalLogs: this.logs.length,
				byLevel,
				oldestLog: oldestTimestamp ? new Date(oldestTimestamp) : undefined,
				newestLog: newestTimestamp ? new Date(newestTimestamp) : undefined,
				rotationCount: this.rotationCount,
			};
		} catch (error) {
			console.error("Error getting log stats:", error);
			return {
				totalLogs: 0,
				byLevel: { error: 0, warn: 0, info: 0, debug: 0, trace: 0 },
				rotationCount: 0,
			};
		}
	}

	/**
	 * Cleans up resources when the logger is no longer needed
	 */
	public dispose(): void {
		this.stopFlushTimer();
		this.flushLogs();
	}

	/**
	 * Gets the number of logs
	 */
	get size(): number {
		return this.logs.length + this.writeBuffer.length;
	}

	/**
	 * Gets all log entries
	 */
	get entries(): Array<LogEntry> {
		return [...this.logs, ...this.writeBuffer];
	}

	/**
	 * Gets the most recent log entry
	 */
	get lastEntry(): LogEntry | undefined {
		if (this.writeBuffer.length > 0) {
			return this.writeBuffer[this.writeBuffer.length - 1];
		}
		return this.logs.length > 0 ? this.logs[this.logs.length - 1] : undefined;
	}

	/**
	 * Gets the singleton instance of the Logger
	 * @returns The Logger instance
	 */
	public static getInstance(): Logger {
		if (!Logger.instance) {
			Logger.instance = new Logger();
		}
		return Logger.instance;
	}
}

// Export the Logger class and LoggerError
export { Logger, LoggerError };

// Export a singleton instance as the default export
/**
 * Gets the logger instance with fallback to console if logger is not initialized
 * This function prevents circular dependencies by using dynamic imports
 */
export const getLogger = () => {
	let loggerModule:
		| Logger
		| { log: (level: string, message: string) => null }
		| null = null;
	if (!loggerModule) {
		try {
			// Use the singleton instance directly since we're in the same module
			loggerModule = Logger.getInstance();
		} catch (err) {
			// If logger isn't available yet (during initialization), use console as fallback
			loggerModule = {
				log: (level: string, message: string) => {
					console[level === "error" ? "error" : "log"](`[Logger] ${message}`);
					return null;
				},
			};
		}
	}
	return loggerModule;
};

export default Logger.getInstance();
