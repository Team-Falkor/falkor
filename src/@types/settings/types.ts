import { ExternalAccountType } from "../accounts";

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
}

export type SettingsTheme = "system" | "light" | "dark";

export type SettingsTitleBarStyle =
  | "icons"
  | "traffic-lights"
  | "native"
  | "none";

export type launchOnStartupType = true | false | "minimized";
