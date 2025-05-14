import type { ExternalAccountType } from "./accounts";

// Define base types for settings values
export type BaseSettingsValue =
	| string
	| number
	| boolean
	| null
	| undefined
	| Array<string | number | boolean | null | undefined>;

// Define a type for nested settings objects with a maximum depth of 1
export type NestedSettingsObject = {
	[key: string]: BaseSettingsValue;
};

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
	preferredDebridService?: "real-debrid" | "torbox";
	maxConcurrentDownloads?: number;

	downloadConfig: {
		maxConcurrentDownloads: number;
		maxRetries: number;
		persistQueue: boolean;
		retryDelay: number;
	};

	// Allow for additional nested settings objects with a maximum depth of 1
	[key: string]:
		| BaseSettingsValue
		| NestedSettingsObject
		| SettingsTheme
		| launchOnStartupType
		| SettingsTitleBarStyle
		| ExternalAccountType;
}

export type SettingsTheme = "system" | "light" | "dark";

export type SettingsTitleBarStyle =
	| "icons"
	| "traffic-lights"
	| "native"
	| "none";

export type launchOnStartupType = true | false | "minimized";
