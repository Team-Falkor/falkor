import { SettingsConfig } from "@/@types";
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

    const mergedSettings = { ...defaultSettings, ...currentSettings };
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

  // Get a setting by key
  public get<K extends keyof SettingsConfig>(key: K): SettingsConfig[K] {
    return this.settingsCache[key];
  }

  // Update a setting
  public update<K extends keyof SettingsConfig>(
    key: K,
    value: SettingsConfig[K]
  ): void {
    this.settingsCache[key] = value;
    this.jsonFileEditor.write(this.settingsCache);
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
