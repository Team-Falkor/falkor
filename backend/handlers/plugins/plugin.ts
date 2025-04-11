import fs from "node:fs";
import { join } from "node:path";
import { constants } from "../../utils";
import logger from "../logging";
import {
  PluginSetupJSON,
  PluginId,
  PluginSetupJSONDisabled,
} from "@team-falkor/shared-types";

/**
 * Custom error class for plugin-related errors
 */
class PluginError extends Error {
  constructor(
    message: string,
    public readonly pluginId?: string
  ) {
    super(message);
    this.name = "PluginError";
  }
}

/**
 * Helper function to safely join API URL and setup path
 */
function joinUrlPath(apiUrl: string, setupPath: string): string {
  if (!apiUrl) return "";
  if (!setupPath) return apiUrl;

  // Remove trailing slash from API URL if present
  const baseUrl = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;
  // Ensure setup path starts with a slash
  const path = setupPath.startsWith("/") ? setupPath : `/${setupPath}`;

  return `${baseUrl}${path}`;
}

export class PluginHandler {
  private hasInitialized = false;

  /**
   * Path to the plugins folder
   */
  private path = constants.pluginsPath;

  /**
   * Maximum number of retry attempts for network operations
   */
  private maxRetries = 3;

  /**
   * Ensures that the plugin folder exists
   */
  private async init() {
    if (this.hasInitialized) return;

    try {
      // Check and create plugins folder if it doesn't exist
      const doesFolderExist = fs.existsSync(this.path);
      if (!doesFolderExist)
        await fs.promises.mkdir(this.path, { recursive: true });

      this.hasInitialized = true;
    } catch (error) {
      const errorMessage = `Error initializing plugin directory: ${error}`;
      console.error(errorMessage);
      logger.log("error", errorMessage);
      throw new PluginError("Initialization failed");
    }
  }

  /**
   * Helper method to safely fetch data from a URL with retries
   * @param url The URL to fetch data from
   * @returns The JSON response data
   * @throws PluginError if the fetch operation fails after all retries
   */
  private async fetchWithRetry<T>(url: string): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(url);

        if (!response.ok) {
          throw new PluginError(
            `HTTP error ${response.status}: ${response.statusText}`
          );
        }

        return (await response.json()) as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Only retry on network errors, not on parsing errors
        if (error instanceof SyntaxError) {
          throw new PluginError(
            `Invalid JSON response from ${url}: ${error.message}`
          );
        }

        // Wait before retrying (exponential backoff)
        if (attempt < this.maxRetries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 100)
          );
        }
      }
    }

    throw new PluginError(
      `Failed to fetch data from ${url} after ${this.maxRetries} attempts: ${lastError?.message}`
    );
  }

  /**
   * Helper method to validate plugin data structure
   * @param data The plugin data to validate
   * @throws PluginError if the plugin data is invalid
   */
  private validatePluginData(data: any): asserts data is PluginSetupJSON {
    if (!data) {
      throw new PluginError("Plugin data is empty");
    }

    if (!data.id) {
      throw new PluginError("Invalid plugin format: 'id' field is missing");
    }

    if (!data.version) {
      throw new PluginError(
        "Invalid plugin format: 'version' field is missing",
        data.id
      );
    }
  }

  /**
   * Installs a plugin from a given URL
   *
   * @param url The URL to the setup.json
   * @returns true if the install was successful, false otherwise
   */
  public async install(url: string): Promise<boolean> {
    try {
      await this.init();

      // Fetch and validate plugin data
      const json = await this.fetchWithRetry<PluginSetupJSON>(url);
      this.validatePluginData(json);

      // Determine file path (handle disabled plugins)
      let filePath = join(this.path, `${json.id}.json`);
      const disabledFilePath = join(this.path, `${json.id}.disabled`);

      if (fs.existsSync(disabledFilePath)) {
        filePath = disabledFilePath;
      }

      // Write the JSON data to the file
      await fs.promises.writeFile(
        filePath,
        JSON.stringify(json, null, 2),
        "utf-8"
      );

      return true;
    } catch (error) {
      const errorMessage = `Failed to install plugin from URL (${url}): ${error instanceof Error ? error.message : error}`;
      console.error(errorMessage);
      logger.log("error", errorMessage);

      return false;
    }
  }

  /**
   * Deletes a plugin by its ID
   *
   * @param pluginId The ID of the plugin to delete
   * @returns true if the delete was successful, false otherwise
   */
  public async delete(pluginId: PluginId): Promise<boolean> {
    try {
      await this.init();

      const filePath = join(this.path, `${pluginId}.json`);
      const disabledFilePath = join(this.path, `${pluginId}.disabled`);

      // Check if the plugin exists in either enabled or disabled state
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      } else if (fs.existsSync(disabledFilePath)) {
        await fs.promises.unlink(disabledFilePath);
        return true;
      }

      // Plugin not found
      return false;
    } catch (error) {
      const errorMessage = `Failed to delete plugin with ID (${pluginId}): ${error instanceof Error ? error.message : error}`;
      console.error(errorMessage);
      logger.log("error", errorMessage);

      return false;
    }
  }

  /**
   * Disables a plugin by renaming its file to .disabled
   *
   * @param pluginId The ID of the plugin to disable
   * @returns true if the disable was successful, false otherwise
   */
  public async disable(pluginId: PluginId): Promise<boolean> {
    try {
      await this.init();

      const filePath = join(this.path, `${pluginId}.json`);
      if (!fs.existsSync(filePath)) return false;

      const disabledPath = join(this.path, `${pluginId}.disabled`);
      await fs.promises.rename(filePath, disabledPath);
      return true;
    } catch (error) {
      const errorMessage = `Failed to disable plugin with ID (${pluginId}): ${error instanceof Error ? error.message : error}`;
      console.error(errorMessage);
      logger.log("error", errorMessage);
      return false;
    }
  }

  /**
   * Enables a plugin by renaming its file back to .json
   *
   * @param pluginId The ID of the plugin to enable
   * @returns true if the enable was successful, false otherwise
   */
  public async enable(pluginId: PluginId): Promise<boolean> {
    try {
      await this.init();

      const filePath = join(this.path, `${pluginId}.disabled`);
      if (!fs.existsSync(filePath)) return false;

      const enabledPath = join(this.path, `${pluginId}.json`);
      await fs.promises.rename(filePath, enabledPath);
      return true;
    } catch (error) {
      const errorMessage = `Failed to enable plugin with ID (${pluginId}): ${error instanceof Error ? error.message : error}`;
      console.error(errorMessage);
      logger.log("error", errorMessage);
      return false;
    }
  }

  /**
   * Fetches the JSON content of a plugin by its ID
   *
   * @param pluginId The ID of the plugin
   * @returns The JSON data of the plugin, or null if not found
   */
  public async get(pluginId: PluginId): Promise<PluginSetupJSON | null> {
    try {
      await this.init();

      const filePath = join(this.path, `${pluginId}.json`);
      if (!fs.existsSync(filePath)) return null;

      const data = await fs.promises.readFile(filePath, "utf-8");
      try {
        const pluginData = JSON.parse(data) as PluginSetupJSON;
        return pluginData;
      } catch (parseError) {
        throw new PluginError(
          `Invalid JSON format in plugin file: ${parseError instanceof Error ? parseError.message : parseError}`,
          pluginId
        );
      }
    } catch (error) {
      const errorMessage = `Failed to fetch plugin with ID (${pluginId}): ${error instanceof Error ? error.message : error}`;
      console.error(errorMessage);
      logger.log("error", errorMessage);
      return null;
    }
  }

  /**
   * Lists all plugins, optionally including disabled plugins
   *
   * @param wantDisabled Whether to include disabled plugins in the list
   * @returns Array of plugin data with disabled status
   */
  public async list(
    wantDisabled: boolean = false
  ): Promise<Array<PluginSetupJSONDisabled>> {
    try {
      await this.init();

      const plugins: Array<PluginSetupJSONDisabled> = [];

      const files = await fs.promises.readdir(this.path);
      for await (const file of files) {
        const filePath = join(this.path, file);
        try {
          // Process enabled plugins
          if (file.endsWith(".json")) {
            const data = await fs.promises.readFile(filePath, "utf-8");
            try {
              const pluginData = JSON.parse(data) as PluginSetupJSON;
              plugins.push({
                disabled: false,
                ...pluginData,
              });
            } catch (parseError) {
              logger.log(
                "error",
                `Failed to parse plugin file ${file}: ${parseError instanceof Error ? parseError.message : parseError}`
              );
              // Continue to next file if parsing fails
              continue;
            }
          }

          // Process disabled plugins if requested
          if (file.endsWith(".disabled") && wantDisabled) {
            const data = await fs.promises.readFile(filePath, "utf-8");
            try {
              const pluginData = JSON.parse(data) as PluginSetupJSON;
              plugins.push({
                disabled: true,
                ...pluginData,
              });
            } catch (parseError) {
              logger.log(
                "error",
                `Failed to parse disabled plugin file ${file}: ${parseError instanceof Error ? parseError.message : parseError}`
              );
              // Continue to next file if parsing fails
              continue;
            }
          }
        } catch (fileError) {
          // Log error but continue processing other files
          logger.log(
            "error",
            `Error processing plugin file ${file}: ${fileError instanceof Error ? fileError.message : fileError}`
          );
          continue;
        }
      }

      return plugins;
    } catch (error) {
      const errorMessage = `Failed to list plugins: ${error instanceof Error ? error.message : error}`;
      console.error(errorMessage);
      logger.log("error", errorMessage);
      return [];
    }
  }

  /**
   * Checks if a plugin has an update available
   *
   * @param pluginId The ID of the plugin to check
   * @returns true if an update is available, false otherwise
   */
  async checkForUpdates(pluginId: PluginId): Promise<boolean> {
    try {
      await this.init();

      const filePath = join(this.path, `${pluginId}.json`);
      if (!fs.existsSync(filePath)) return false;

      const data = await fs.promises.readFile(filePath, "utf-8");
      let json: PluginSetupJSON;

      try {
        json = JSON.parse(data) as PluginSetupJSON;
      } catch (parseError) {
        throw new PluginError(
          `Invalid JSON format in plugin file: ${parseError instanceof Error ? parseError.message : parseError}`,
          pluginId
        );
      }

      if (!json.api_url || !json.setup_path) return false;

      const url = joinUrlPath(json.api_url, json.setup_path);
      const latest = await this.fetchWithRetry<PluginSetupJSON>(url);

      // Compare versions to determine if an update is available
      if (!latest.version) return false;
      if (latest.version === json.version) return false;

      return true;
    } catch (error) {
      const errorMessage = `Failed to check for updates for plugin ${pluginId}: ${error instanceof Error ? error.message : error}`;
      console.error(errorMessage);
      logger.log("error", `[PLUGIN] ${errorMessage}`);
      return false;
    }
  }

  /**
   * Checks all plugins for available updates
   *
   * @param checkForDisabled Whether to check disabled plugins for updates
   * @returns Array of plugins that have updates available
   */
  async checkForUpdatesAll(
    checkForDisabled: boolean = false
  ): Promise<Array<PluginSetupJSONDisabled>> {
    try {
      await this.init();

      const plugins: Array<PluginSetupJSONDisabled> = [];
      const files = await fs.promises.readdir(this.path);

      for await (const file of files) {
        try {
          const filePath = join(this.path, file);
          const isDisabled = file.endsWith(".disabled");
          const isEnabled = file.endsWith(".json");

          // Skip disabled plugins if not requested
          if (isDisabled && !checkForDisabled) continue;
          // Skip files that are not plugins
          if (!isEnabled && !isDisabled) continue;

          // Read and parse plugin data
          const data = await fs.promises.readFile(filePath, "utf-8");
          let json: PluginSetupJSON;

          try {
            json = JSON.parse(data) as PluginSetupJSON;
          } catch (parseError) {
            logger.log(
              "error",
              `Failed to parse plugin file ${file}: ${parseError instanceof Error ? parseError.message : parseError}`
            );
            continue;
          }

          // Skip plugins without update information
          if (!json.api_url || !json.setup_path) continue;

          // Fetch latest version
          const url = joinUrlPath(json.api_url, json.setup_path);
          let latest: PluginSetupJSON;

          try {
            latest = await this.fetchWithRetry<PluginSetupJSON>(url);
          } catch (fetchError) {
            logger.log(
              "error",
              `Failed to fetch updates for plugin ${json.id}: ${fetchError instanceof Error ? fetchError.message : fetchError}`
            );
            continue;
          }

          // Skip if no update is available
          if (!latest.version || latest.version === json.version) continue;

          // Add plugin to the list of plugins with updates
          plugins.push({
            disabled: isDisabled,
            ...json,
          });
        } catch (fileError) {
          // Log error but continue processing other files
          logger.log(
            "error",
            `Error processing plugin file: ${fileError instanceof Error ? fileError.message : fileError}`
          );
          continue;
        }
      }

      return plugins;
    } catch (error) {
      const errorMessage = `Failed to check for updates: ${error instanceof Error ? error.message : error}`;
      console.error(errorMessage);
      logger.log("error", errorMessage);
      return [];
    }
  }

  /**
   * Updates a specific plugin by its ID if a new version is available.
   *
   * @param pluginId The ID of the plugin to update
   * @returns true if the update was successful, false otherwise
   */
  public async update(pluginId: PluginId): Promise<boolean> {
    try {
      await this.init();

      // Check if the plugin exists in enabled or disabled state
      const enabledPath = join(this.path, `${pluginId}.json`);
      const disabledPath = join(this.path, `${pluginId}.disabled`);

      let filePath: string;

      if (fs.existsSync(enabledPath)) {
        filePath = enabledPath;
      } else if (fs.existsSync(disabledPath)) {
        filePath = disabledPath;
      } else {
        return false; // Plugin not found
      }

      // Read and parse the existing plugin data
      const data = await fs.promises.readFile(filePath, "utf-8");
      let json: PluginSetupJSON;

      try {
        json = JSON.parse(data) as PluginSetupJSON;
      } catch (parseError) {
        throw new PluginError(
          `Invalid JSON format in plugin file: ${parseError instanceof Error ? parseError.message : parseError}`,
          pluginId
        );
      }

      if (!json.api_url || !json.setup_path) {
        return false; // Missing update information
      }

      // Construct the update URL and fetch the latest version
      const url = joinUrlPath(json.api_url, json.setup_path);
      const latest = await this.fetchWithRetry<PluginSetupJSON>(url);

      // Compare versions to determine if an update is necessary
      if (!latest.version) return false;
      if (latest.version === json.version) return false;

      // Remove the old plugin file and save the updated data
      await fs.promises.unlink(filePath);
      await fs.promises.writeFile(
        filePath,
        JSON.stringify(latest, null, 2),
        "utf-8"
      );

      return true;
    } catch (error) {
      const errorMessage = `Failed to update plugin with ID (${pluginId}): ${error instanceof Error ? error.message : error}`;
      console.error(errorMessage);
      logger.log("error", errorMessage);
      return false;
    }
  }

  /**
   * Updates all plugins if a new version is available.
   * If a plugin is disabled, it will be updated and remain disabled.
   * If a plugin is enabled, it will be updated and remain enabled.
   *
   * @returns An array of JSON objects containing the updated plugins.
   * The objects have the same structure as the original JSON data,
   * but with the added "disabled" field, which is true if the plugin
   * was disabled before the update, and false otherwise.
   */
  async updateAll(): Promise<Array<PluginSetupJSONDisabled>> {
    try {
      await this.init();

      const plugins: Array<PluginSetupJSONDisabled> = [];
      const files = await fs.promises.readdir(this.path);

      for await (const file of files) {
        try {
          const filePath = join(this.path, file);
          const isDisabled = file.endsWith(".disabled");
          const isEnabled = file.endsWith(".json");

          // Skip files that are not plugins
          if (!isEnabled && !isDisabled) continue;

          // Read and parse plugin data
          const data = await fs.promises.readFile(filePath, "utf-8");
          let json: PluginSetupJSON;

          try {
            json = JSON.parse(data) as PluginSetupJSON;
          } catch (parseError) {
            logger.log(
              "error",
              `Failed to parse plugin file ${file}: ${parseError instanceof Error ? parseError.message : parseError}`
            );
            continue;
          }

          // Skip plugins without update information
          if (!json.api_url || !json.setup_path) continue;

          // Fetch latest version
          const url = joinUrlPath(json.api_url, json.setup_path);
          let latest: PluginSetupJSON;

          try {
            latest = await this.fetchWithRetry<PluginSetupJSON>(url);
          } catch (fetchError) {
            logger.log(
              "error",
              `Failed to fetch updates for plugin ${json.id}: ${fetchError instanceof Error ? fetchError.message : fetchError}`
            );
            continue;
          }

          // Skip if no update is available
          if (!latest.version || latest.version === json.version) continue;

          // Update the plugin
          await fs.promises.unlink(filePath);
          await fs.promises.writeFile(
            filePath,
            JSON.stringify(latest, null, 2),
            "utf-8"
          );

          // Add the plugin to the list of updated plugins
          plugins.push({
            disabled: isDisabled,
            ...json,
          });
        } catch (fileError) {
          // Log error but continue processing other files
          logger.log(
            "error",
            `Error processing plugin file: ${fileError instanceof Error ? fileError.message : fileError}`
          );
          continue;
        }
      }

      return plugins;
    } catch (error) {
      const errorMessage = `Failed to update plugins: ${error instanceof Error ? error.message : error}`;
      console.error(errorMessage);
      logger.log("error", errorMessage);
      return [];
    }
  }
}

const pluginHandler = new PluginHandler();

export default pluginHandler;
