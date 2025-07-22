import type { RouterOutputs } from "@/@types";

export type GameFileMatchResult = {
	file: {
		name: string;
		path: string;
		isDirectory: boolean;
		size?: number;
		lastModified?: string;
	};
	matches: {
		game: RouterOutputs["igdb"]["search"][number];
		confidence: number;
		reason: string;
	}[];
	bestMatch: {
		game: RouterOutputs["igdb"]["search"][number];
		confidence: number;
		reason: string;
	} | null;
};