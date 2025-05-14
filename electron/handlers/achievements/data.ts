import type { ISchemaForGame } from "@/@types";
import logger from "../logging";
import { SettingsManager } from "../settings/settings";

const settings = SettingsManager.getInstance();

class AchievementData {
	readonly api_url: string | undefined = settings.get("api_base_url");

	async get(steamId: string, lang = "en"): Promise<ISchemaForGame> {
		try {
			const url = `${this.api_url}/achievements/${steamId}?lang=${lang}`;

			const request = await fetch(url, {
				method: "GET",
			});

			if (!request.ok) throw new Error(request.statusText);

			const data: ISchemaForGame = await request.json();

			return data;
		} catch (error) {
			console.log(error);
			logger.log("error", `Error getting achievement data: ${error}`);
			throw error;
		}
	}
}

export const achievementData = new AchievementData();
