import { ITADPrice } from "@/lib/api/itad/types";
import { PluginConfig, PluginSearchResponse } from "@team-falkor/shared-types";
import { UpdateInfo } from "electron-updater";
import { JSX, ReactElement } from "react";

export type IGDBImageSize =
  | "original"
  | "cover_small"
  | "screenshot_med"
  | "cover_big"
  | "cover_med"
  | "logo_med"
  | "screenshot_big"
  | "screenshot_huge"
  | "thumb"
  | "micro"
  | "720p"
  | "1080p";

export interface Provider {
  label: string;
  value: string;
}

export interface InfoProps {
  error: Error | null;
  isPending: boolean;
}

export interface InfoItadProps {
  itadData: ITADPrice[] | undefined;
  itadPending: boolean;
  itadError: Error | null;
}
export interface infoHLTBProps {
  hltbData: HLTBSearchGameData | undefined;
  hltbPending: boolean;
  hltbError: Error | null;
}

export type NonDefaultSource = {
  url: string;
  type: "magnet" | "torrent" | "ddl";
  title: string;
  name: string;
};

export type ItemDownload = {
  sources: Array<PluginSearchResponse | ITADPrice>;
  name: string;
  id?: string;
  multiple_choice?: boolean;
};

export interface ListGame {
  game_id: number;
  title: string;
  description?: string;
  image?: string;
  release_date?: string;
  genre?: string;
}

export interface List {
  id: number;
  name: string;
  description?: string;
}

export type SourceType = "magnet" | "torrent" | "ddl";

export type ProtonDBTier =
  | "borked"
  | "platinum"
  | "gold"
  | "silver"
  | "bronze"
  | "pending";

export enum ProtonDBTierColor {
  borked = "#ff0000", // Red
  platinum = "#e5e4e2", // Platinum
  gold = "#ffd700", // Gold
  silver = "#c0c0c0", // Silver
  bronze = "#cd7f32", // Bronze
  pending = "#808080", // Gray
}

export interface ProtonDBSummary {
  bestReportedTier: ProtonDBTier;
  confidence: string;
  score: number;
  tier: ProtonDBTier;
  total: number;
  trendingTier: ProtonDBTier;
}

export type SearchPluginResponse =
  | {
      message: string;
      success: false;
    }
  | {
      data: Array<SearchPluginData>;
      success: true;
    };

export type SearchPluginData = {
  id: string;
  name: string;
  sources: PluginSearchResponse[];
  multiple_choice?: boolean;
  config: false | PluginConfig;
};

export interface LinkItemType {
  icon: ReactElement;
  title: string;
  url: string;
}

export interface AppInfo {
  app_version: string;
  electron_version: string;
  app_name: string;
  app_path: string;
  user_data_path: string;
  os: string;
}

export type SourceProvider = {
  label: string;
  value: string;
};

export interface AutoLaunchOptions {
  enabled: boolean;
  isHidden: boolean;
}

export interface Tab {
  name: string;
  component: JSX.Element;
}

export interface Response<T = any> {
  message: string;
  error: boolean;
  data: T | null;
  timestamp?: string;
}

export type Cracker =
  | "codex"
  | "rune"
  | "onlinefix"
  | "goldberg"
  | "rld"
  | "empress"
  | "skidrow"
  | "creamapi"
  | "smartsteamemu"
  | "flt"
  | "razor1911"
  | "rle"
  | "_3dm";

export type NotificationType = "download_completed" | "achievement_unlocked";

export type UpdateInfoWithReleaseNotes = UpdateInfo & {
  releaseNotes: string;
};
