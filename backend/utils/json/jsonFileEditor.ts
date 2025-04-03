import * as fs from "fs";
import * as path from "path";

/**
 * Options for the JsonFileEditor constructor
 */
interface JsonFileEditorOptions<T extends object> {
  /** Path to the JSON file */
  filePath: string;
  /** Default content to use if file doesn't exist */
  defaultContent?: T;
  /** Function to validate the data structure */
  validate?: (data: unknown) => data is T;
  /** Whether to create parent directories if they don't exist */
  createDirs?: boolean;
  /** Whether to enable verbose logging */
  verbose?: boolean;
}

/**
 * Result of a JSON file operation
 */
interface JsonOperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * A class for safely reading, writing, and manipulating JSON files
 */
class JsonFileEditor<T extends object> {
  private filePath: string;
  private defaultContent?: T;
  private validate?: (data: unknown) => data is T;
  private verbose: boolean;

  /**
   * Creates a new JsonFileEditor instance
   * @param options Configuration options
   */
  constructor(options: JsonFileEditorOptions<T>) {
    this.filePath = options.filePath;
    this.defaultContent = options.defaultContent;
    this.validate = options.validate;
    this.verbose = options.verbose ?? false;

    // Create parent directories if needed
    if (options.createDirs) {
      const dirname = path.dirname(this.filePath);
      if (!fs.existsSync(dirname)) {
        try {
          fs.mkdirSync(dirname, { recursive: true });
        } catch (error) {
          this.logError(`Failed to create directory ${dirname}`, error);
        }
      }
    }

    // Initialize with default content if file doesn't exist
    if (!fs.existsSync(this.filePath) && this.defaultContent) {
      this.write(this.defaultContent);
    }
  }

  /**
   * Reads and parses the JSON file
   * @returns The parsed data or null if an error occurred
   */
  public read(): T | null {
    try {
      // Check if file exists
      if (!fs.existsSync(this.filePath)) {
        this.logError(`File does not exist: ${this.filePath}`);
        return null;
      }

      // Read and parse file
      const data = fs.readFileSync(this.filePath, "utf-8");
      if (!data || data.trim() === "") {
        this.logError(`File is empty: ${this.filePath}`);
        return null;
      }

      // Parse JSON
      let parsedData: unknown;
      try {
        parsedData = JSON.parse(data);
      } catch (parseError) {
        this.logError(`Invalid JSON format in ${this.filePath}`, parseError);
        return null;
      }

      // Validate data structure if validator is provided
      if (this.validate && !this.validate(parsedData)) {
        this.logError(`Validation failed for JSON data in ${this.filePath}`);
        return null;
      }

      return parsedData as T;
    } catch (error) {
      this.logError(`Error reading JSON file: ${this.filePath}`, error);
      return null;
    }
  }

  /**
   * Reads the JSON file with detailed result information
   * @returns An object containing success status, data, and any error message
   */
  public readWithResult(): JsonOperationResult<T> {
    try {
      const data = this.read();
      if (data === null) {
        return { success: false, error: `Failed to read data from ${this.filePath}` };
      }
      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Writes data to the JSON file
   * @param data The data to write
   * @returns True if successful, false otherwise
   */
  public write(data: T): boolean {
    // Validate data if validator is provided
    if (this.validate && !this.validate(data)) {
      this.logError(`Validation failed. Data not written to ${this.filePath}`);
      return false;
    }

    try {
      // Create a backup of the existing file if it exists
      this.createBackup();

      // Write the new data
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), "utf-8");
      
      if (this.verbose) {
        console.log("info", `JSON file written successfully: ${this.filePath}`);
      }
      return true;
    } catch (error) {
      this.logError(`Error writing JSON file: ${this.filePath}`, error);
      return false;
    }
  }

  /**
   * Writes data to the JSON file with detailed result information
   * @param data The data to write
   * @returns An object containing success status and any error message
   */
  public writeWithResult(data: T): JsonOperationResult<T> {
    try {
      const success = this.write(data);
      return success 
        ? { success: true, data } 
        : { success: false, error: `Failed to write data to ${this.filePath}` };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Updates specific fields in the JSON file
   * @param updates Partial data to update
   * @returns True if successful, false otherwise
   */
  public update(updates: Partial<T>): boolean {
    const currentData = this.read();
    if (!currentData) {
      this.logError(`Error: Unable to read current data for update from ${this.filePath}`);
      return false;
    }

    const updatedData = { ...currentData, ...updates };

    return this.write(updatedData);
  }

  /**
   * Updates specific fields in the JSON file with detailed result information
   * @param updates Partial data to update
   * @returns An object containing success status, updated data, and any error message
   */
  public updateWithResult(updates: Partial<T>): JsonOperationResult<T> {
    try {
      const currentData = this.read();
      if (!currentData) {
        return { success: false, error: `Unable to read current data for update from ${this.filePath}` };
      }

      const updatedData = { ...currentData, ...updates };
      const success = this.write(updatedData);
      
      return success 
        ? { success: true, data: updatedData } 
        : { success: false, error: `Failed to write updated data to ${this.filePath}` };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Deletes a specific key from the JSON data
   * @param key The key to delete
   * @returns True if successful, false otherwise
   */
  public deleteKey<K extends keyof T>(key: K): boolean {
    const data = this.read();
    if (!data) {
      this.logError(`Unable to read data from ${this.filePath} for key deletion`);
      return false;
    }
    
    if (typeof data === "object" && key in data) {
      delete data[key];
      return this.write(data);
    } else {
      this.logError(`Key "${String(key)}" does not exist in JSON data in ${this.filePath}`);
      return false;
    }
  }

  /**
   * Resets the JSON file to its default content
   * @returns True if successful, false otherwise
   */
  public reset(): boolean {
    if (this.defaultContent) {
      return this.write(this.defaultContent);
    } else {
      this.logError(`No default content provided to reset ${this.filePath}`);
      return false;
    }
  }

  /**
   * Creates a backup of the current file if it exists
   * @private
   */
  private createBackup(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const backupPath = `${this.filePath}.backup`;
        fs.copyFileSync(this.filePath, backupPath);
        if (this.verbose) {
          console.log("info", `Created backup at ${backupPath}`);
        }
      }
    } catch (error) {
      this.logError("Failed to create backup", error);
    }
  }

  /**
   * Logs an error message
   * @param message The error message
   * @param error Optional error object
   * @private
   */
  private logError(message: string, error?: unknown): void {
    const errorDetails = error instanceof Error ? error.message : String(error || "");
    const fullMessage = errorDetails ? `${message}: ${errorDetails}` : message;
    console.log("error", fullMessage);
  }
}

export default JsonFileEditor;
