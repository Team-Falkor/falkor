import { ISchemaForGame } from "@/@types";
import { constants } from "backend/utils";

class AchievementData {
  readonly api_url: string | undefined = constants.apiUrl;

  async get(steamId: string, lang: string = "en"): Promise<ISchemaForGame> {
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
      throw error;
    }
  }
}

export const achievementData = new AchievementData();