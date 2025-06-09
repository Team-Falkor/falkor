import type { ApiResponse } from "@team-falkor/shared-types";
import type { IGetOwnedGamesResponse } from "@/@types";
import { SettingsManager } from "../settings/settings";
import { achievementData } from "./data";

const settings = SettingsManager.getInstance();

class AchievementImporter {
	readonly api_url: string | undefined = settings.get("api_base_url");

	async getGames(
		steamId: string,
		lang = "en",
	): Promise<ApiResponse<IGetOwnedGamesResponse>> {
		try {
			const url = `${this.api_url}/steam/user/${steamId}/games?lang=${lang}`;

			const request = await fetch(url, {
				method: "GET",
			});

			if (!request.ok) {
				console.log("no games found");
				return {
					success: false,
					message: request.statusText,
					data: null,
				};
			}

			const data: ApiResponse<IGetOwnedGamesResponse> = await request.json();

			return data;
		} catch (error) {
			console.error(error);
			return {
				success: false,
				message: "An error occurred while fetching the games",
				data: null,
			};
		}
	}

	async importAchievements(steamId: string, lang = "en") {
		try {
			const games = await this.getGames(steamId, lang);

			if (!games.success)
				throw new Error(
					games.message ?? "An error occurred while fetching the games",
				);

			// filter out all games with no playtime
			const gamesWithPlaytime = games.data?.response?.games.filter(
				(game) => game.playtime_forever > 0,
			);

			if (!gamesWithPlaytime) throw new Error("No games with playtime found");

			for (const game of gamesWithPlaytime) {
				const achievements = await achievementData.getUserAchievements(
					steamId,
					game.appid,
					lang,
				);

				if (!achievements?.playerstats?.achievements) {
					console.log("No achievements found");
					continue;
				}

				const playerAchievements = achievements.playerstats.achievements;

				if (!playerAchievements) {
					console.log("No achievements found");
					continue;
				}

				const unlockedAchievements = playerAchievements.filter(
					(achievement) => achievement.achieved === 1,
				);

				if (!unlockedAchievements) {
					console.log("No unlocked achievements found");
					continue;
				}

				console.log(unlockedAchievements);
			}
		} catch (error) {
			console.log(error);
		}
	}
}

export const achievementImporter = new AchievementImporter();
