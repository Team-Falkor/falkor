import { NestedSettingsObject, SettingsConfig, SettingsValue } from "@/@types";
import { constants } from "../constants";
import JsonFileEditor from "../json/jsonFileEditor";
import { defaultSettings } from "./constants";

class Settings {
  private jsonFileEditor: JsonFileEditor<SettingsConfig>;
  private settingsCache: SettingsConfig;

  constructor() {
    this.jsonFileEditor = new JsonFileEditor<SettingsConfig>({
      filePath: constants.settingsPath,
      defaultContent: defaultSettings,
    });

    // Load settings from the JSON file or default settings
    const existingSettings = this.jsonFileEditor.read() || {};
    this.settingsCache = this.ensureDefaults(existingSettings);
  }

  /**
   * Ensures all default settings are present in the provided settings object.
   * Adds missing settings with their default values.
   * @param currentSettings - The current settings read from the file.
   * @returns The updated settings object with defaults filled in.
   */
  private ensureDefaults(
    currentSettings: Partial<SettingsConfig>
  ): SettingsConfig {
    let updated = false;

    // Create a deep copy of default settings to avoid reference issues
    const mergedSettings = this.deepMerge(
      this.deepCopy(defaultSettings),
      currentSettings
    );

    // Check for missing top-level keys
    for (const key of Object.keys(
      defaultSettings
    ) as (keyof SettingsConfig)[]) {
      if (!(key in currentSettings)) {
        console.log(`Adding missing setting: ${key} with default value.`);
        updated = true;
      }
    }

    if (updated) {
      this.jsonFileEditor.write(mergedSettings);
    }

    return mergedSettings;
  }

  // Helper method to create a deep copy of an object
  private deepCopy<T>(obj: T): T {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.deepCopy(item)) as unknown as T;
    }

    const copy = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        copy[key] = this.deepCopy(obj[key]);
      }
    }
    return copy;
  }

  // Helper method to deep merge objects
  private deepMerge(target: any, source: any): any {
    if (source === null || typeof source !== "object") {
      return source;
    }

    if (target === null || typeof target !== "object") {
      return this.deepCopy(source);
    }

    const output = { ...target };

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        if (
          typeof source[key] === "object" &&
          !Array.isArray(source[key]) &&
          typeof output[key] === "object" &&
          !Array.isArray(output[key])
        ) {
          // Recursively merge nested objects
          output[key] = this.deepMerge(output[key], source[key]);
        } else {
          // For arrays or primitive values, replace with source value
          output[key] = this.deepCopy(source[key]);
        }
      }
    }

    return output;
  }

  // Get a setting by key with support for nested objects using dot notation
  public get<K extends keyof SettingsConfig>(key: K): SettingsConfig[K];
  public get(path: string): SettingsValue | undefined;
  public get(keyOrPath: string): SettingsValue | undefined {
    if (keyOrPath.includes(".")) {
      // Handle nested path with dot notation
      return this.getNestedValue(this.settingsCache, keyOrPath);
    }
    return this.settingsCache[keyOrPath as keyof SettingsConfig];
  }

  // Helper method to get nested values using dot notation
  private getNestedValue(
    obj: NestedSettingsObject,
    path: string
  ): SettingsValue | undefined {
    const keys = path.split(".");
    let current: any = obj;

    // Navigate through the object following the path
    for (const key of keys) {
      if (
        current === undefined ||
        current === null ||
        typeof current !== "object"
      ) {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }

  // Update a setting with support for nested objects using dot notation
  public update<K extends keyof SettingsConfig>(
    key: K,
    value: SettingsConfig[K]
  ): void;
  public update(path: string, value: SettingsValue): void;
  public update(keyOrPath: string, value: SettingsValue): void {
    if (keyOrPath.includes(".")) {
      // Handle nested path with dot notation
      this.setNestedValue(this.settingsCache, keyOrPath, value);
    } else {
      this.settingsCache[keyOrPath as keyof SettingsConfig] = value;
    }
    this.jsonFileEditor.write(this.settingsCache);
  }

  // Helper method to set nested values using dot notation
  private setNestedValue(
    obj: NestedSettingsObject,
    path: string,
    value: SettingsValue
  ): void {
    const keys = path.split(".");
    const lastKey = keys.pop()!;
    let current: any = obj;

    // Navigate to the parent object of the value we want to set
    for (const key of keys) {
      // If the path doesn't exist, create it
      if (
        current[key] === undefined ||
        current[key] === null ||
        typeof current[key] !== "object"
      ) {
        current[key] = {};
      }
      current = current[key];
    }

    // Set the value at the final key
    current[lastKey] = value;
  }

  // Reset all settings to defaults
  public resetToDefaults(): SettingsConfig {
    this.settingsCache = { ...defaultSettings };
    this.jsonFileEditor.write(this.settingsCache);
    return this.settingsCache;
  }

  // Optional method to reload settings from the JSON file
  public reload(): SettingsConfig | null {
    const newSettings = this.jsonFileEditor.read();
    if (newSettings) {
      this.settingsCache = this.ensureDefaults(newSettings);
    }
    return this.settingsCache;
  }

  public read(): SettingsConfig | null {
    try {
      const settings = this.jsonFileEditor.read();
      if (settings) {
        this.settingsCache = this.ensureDefaults(settings);
      }
      return settings;
    } catch (error) {
      console.error("Error reading settings:", error);
      return null;
    }
  }
}

const settings = new Settings();
export { settings };
