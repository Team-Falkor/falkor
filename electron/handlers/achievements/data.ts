import type {
	IGetPlayerAchievementsResponse,
	IGetSchemaForGame,
} from "@/@types";
import logger from "../logging";
import { SettingsManager } from "../settings/settings";

const settings = SettingsManager.getInstance();

class AchievementData {
	readonly api_url: string | undefined = settings.get("api_base_url");

	async get(steamId: string, lang = "en"): Promise<IGetSchemaForGame> {
		try {
			const url = `${this.api_url}/achievements/${steamId}?lang=${lang}`;

			const request = await fetch(url, {
				method: "GET",
			});

			if (!request.ok) throw new Error(request.statusText);

			const data: IGetSchemaForGame = await request.json();

			return data;
		} catch (error) {
			console.log(error);
			logger.log("error", `Error getting achievement data: ${error}`);
			throw error;
		}
	}

	async getUserAchievements(
		steamId: string,
		appId: number,
		lang = "en",
	): Promise<IGetPlayerAchievementsResponse | null> {
		try {
			const url = `${this.api_url}/achievements/user/${steamId}/game/${appId}?lang=${lang}`;

			const request = await fetch(url, {
				method: "GET",
			});

			if (!request.ok) {
				console.log("no achievements found");
				return null;
			}

			const data: IGetPlayerAchievementsResponse = await request.json();
			return data;
		} catch (error) {
			console.log(error);
			logger.log("error", `Error getting user achievements: ${error}`);
			throw error;
		}
	}
}

export const achievementData = new AchievementData();
