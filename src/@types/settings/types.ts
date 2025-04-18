import { ExternalAccountType } from "../accounts";

// Define a recursive type for nested settings objects
export type NestedSettingsObject = {
  [key: string]: SettingsValue;
};

// Define possible types for settings values
export type SettingsValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | NestedSettingsObject
  | Array<SettingsValue>;

export interface SettingsConfig {
  theme: SettingsTheme;
  language: string;
  downloadsPath: string;
  autoCheckForUpdates: boolean;
  checkForUpdatesOnStartup: boolean;
  checkForPluginUpdatesOnStartup: boolean;
  launchOnStartup: launchOnStartupType;
  closeToTray: boolean;
  useAccountsForDownloads: boolean;
  titleBarStyle: SettingsTitleBarStyle;
  maxDownloadSpeed: number;
  maxUploadSpeed: number;
  notifications: boolean;
  api_base_url: string;
  preferredDebridService?: ExternalAccountType;
  maxConcurrentDownloads?: number;
  // Allow for additional nested settings objects
  [key: string]: SettingsValue;
}

export type SettingsTheme = "system" | "light" | "dark";

export type SettingsTitleBarStyle =
  | "icons"
  | "traffic-lights"
  | "native"
  | "none";

export type launchOnStartupType = true | false | "minimized";
