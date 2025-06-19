import type { Cracker } from "../types";

export interface UnlockedAchievement {
	name: string;
	unlockTime: number;
}

export interface AchievementFile {
	cracker: Cracker;
	path: string;
}

export interface AchivementStat {
	name: string;
	displayName: string;
	hidden: number;
	description?: string;
	icon: string;
	icongray: string;
	unlockTime: number;
}

export interface Achievement {
	name: string;
	defaultvalue: number;
	displayName: string;
	hidden: number;
	icon: string;
	icongray: string;
	description?: string;
}

export interface AvailableGameStats {
	achievements: Achievement[];
}

export interface IGame {
	gameName: string;
	gameVersion: string;
	availableGameStats?: AvailableGameStats;
}

export interface IGetSchemaForGame {
	game: IGame;
}

export interface IPlayerAchievement {
	apiname: string;
	achieved: number;
	unlocktime: number;
	name?: string;
	description?: string;
}

export interface IPlayerStats {
	steamID: string;
	gameName: string;
	achievements?: IPlayerAchievement[];
	success: boolean;
	error?: string;
}

export interface IGetPlayerAchievementsResponse {
	playerstats: IPlayerStats;
}

export interface IOwnedGame {
	appid: number;
	name?: string;
	playtime_forever: number;
	img_icon_url?: string;
	img_logo_url?: string;
	playtime_windows_forever: number;
	playtime_mac_forever: number;
	playtime_linux_forever: number;
	rtime_last_played: number;
	playtime_2weeks?: number;
	has_community_visible_stats?: boolean;
}

export interface IGetOwnedGamesResponseData {
	game_count: number;
	games: IOwnedGame[];
}

export interface IGetOwnedGamesResponse {
	response: IGetOwnedGamesResponseData | Record<string, never>;
}
