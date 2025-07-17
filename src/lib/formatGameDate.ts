import type { IGDBReturnDataType, InfoReturn } from "@/@types";

export interface GameDateResult {
	human: string;
	epoch: number;
}

/**
 * Formats a game's release date into both human-readable and epoch formats
 * @param game - The IGDB game object
 * @returns Object with human and epoch properties, or undefined if no date is available
 */
export function formatGameDate(
	game: IGDBReturnDataType | InfoReturn | null | undefined,
): GameDateResult | undefined {
	if (game?.first_release_date) {
		const date = new Date(game.first_release_date * 1000);
		return {
			human: date.toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
			}),
			epoch: game.first_release_date
		};
	}

	if (!game) return undefined;

	const humanDate = game.release_dates?.[0]?.human;
	if (humanDate && game.release_dates?.[0]?.date) {
		return {
			human: humanDate,
			epoch: game.release_dates[0].date
		};
	}

	return undefined;
}
