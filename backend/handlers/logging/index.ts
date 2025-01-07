import { LogEntry, LogLevel, LoggerFilterOptions } from "@/@types/logs";
import { constants } from "../../utils";
import JsonFileEditor from "../../utils/json/jsonFileEditor";

class Logger {
  private logsPath = constants.logsPath;
  private jsonFileEditor: JsonFileEditor<Array<LogEntry>>;
  private logs: Set<LogEntry>;

  constructor() {
    this.jsonFileEditor = new JsonFileEditor<Array<LogEntry>>({
      filePath: this.logsPath,
      defaultContent: [],
    });

    this.logs = new Set(this.jsonFileEditor.read() || []);
  }

  public log(level: LogLevel, message: string): LogEntry | null {
    try {
      const timestamp = Date.now();
      const log: LogEntry = { level, message, timestamp };
      this.logs.add(log);
      this.jsonFileEditor.write([...this.logs]);

      return log;
    } catch (error) {
      console.error("Error logging:", error);
      return null;
    }
  }

  public clear(): void {
    try {
      this.logs.clear();
      this.jsonFileEditor.write([]);
    } catch (error) {
      console.error("Error clearing logs:", error);
    }
  }

  public read(): Array<LogEntry> {
    try {
      const logs = this.jsonFileEditor.read();
      if (!logs?.length) return [];

      this.logs = new Set(logs);
      return logs;
    } catch (error) {
      console.error("Error reading logs:", error);
      return [];
    }
  }

  public remove(timestamp: number): void {
    try {
      const logs = this.jsonFileEditor.read();
      if (!logs) return;

      const filteredLogs = logs.filter((log) => log.timestamp !== timestamp);
      this.jsonFileEditor.write(filteredLogs);
    } catch (error) {
      console.error("Error removing log:", error);
    }
  }

  public filter(options: LoggerFilterOptions): Array<LogEntry> {
    try {
      const { date, level } = options;
      const filteredLogs = Array.from(this.logs).filter((log) => {
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

  public getLoggedDates(includeTime?: boolean): string[] {
    try {
      // if includeTime return all unque dates filtered with the time included, if not return all unique dates
      const dates = Array.from(this.logs).map((log) => {
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

  get size(): number {
    return this.logs.size;
  }

  get entries(): Array<LogEntry> {
    return [...this.logs];
  }

  get lastEntry(): LogEntry | undefined {
    return this.logs.size ? this.logs.values().next().value : undefined;
  }
}

const logger = new Logger();

export { logger };
