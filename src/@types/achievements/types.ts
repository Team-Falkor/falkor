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

export interface ISchemaForGame {
	game: ISchemaForGameGame;
}

export interface ISchemaForGameGame {
	gameName: string;
	gameVersion: string;
	availableGameStats: ISchemaForGameAvailableGameStats;
}

export interface ISchemaForGameAvailableGameStats {
	achievements: ISchemaForGameAchievement[];
}

export interface ISchemaForGameAchievement {
	name: string;
	defaultvalue: number;
	displayName: string;
	hidden: number;
	icon: string;
	icongray: string;
	description?: string;
}
