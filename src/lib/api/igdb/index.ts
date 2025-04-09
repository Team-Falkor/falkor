import { getSteamIdFromWebsites } from "@/lib/helpers";
import { BaseApi } from "../base";
import { defaultFields } from "./constants";
import { ApiResponse, IGDBReturnDataType, InfoReturn } from "./types";
import { genreAPI } from "./genre";

const { VITE_TWITCH_CLIENT_ID, VITE_TWITCH_CLIENT_SECRET } = import.meta.env;

type TokenType = { accessToken: string | null; expiresIn: number };

class IGDB extends BaseApi {
  private clientId: string = VITE_TWITCH_CLIENT_ID ?? "";
  private clientSecret: string = VITE_TWITCH_CLIENT_SECRET ?? "";
  private clientAccessToken?: string;
  private gettingAccessToken = false;

  private getCachedToken(): TokenType {
    const token = localStorage.getItem("igdb_access_token");
    const expiration = Number(
      localStorage.getItem("igdb_token_expiration") ?? "0"
    );

    return {
      accessToken: token ?? null,
      expiresIn: expiration,
    };
  }

  private async getNewToken(maxRetries = 3): Promise<TokenType> {
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        const response = await fetch(
          `https://id.twitch.tv/oauth2/token?client_id=${this.clientId}&client_secret=${this.clientSecret}&grant_type=client_credentials`,
          { method: "POST" }
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const token = data.access_token;
        const expiration = Date.now() + data.expires_in;

        localStorage.setItem("igdb_access_token", token);
        localStorage.setItem("igdb_token_expiration", expiration.toString());
        this.clientAccessToken = token;

        return { accessToken: token, expiresIn: expiration };
      } catch (error) {
        retries++;
        console.error(`Error fetching new token (attempt ${retries}/${maxRetries}):`, error);
        if (retries >= maxRetries) {
          return { accessToken: null, expiresIn: 0 };
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }
    
    return { accessToken: null, expiresIn: 0 };
  }

  private hasTokenExpired(expiration: number): boolean {
    return expiration < Date.now() - 100;
  }

  private async renewToken(): Promise<TokenType> {
    const newToken = await this.getNewToken();
    return newToken;
  }

  async getAccessToken(): Promise<TokenType | void> {
    if (this.gettingAccessToken) return;
    this.gettingAccessToken = true;

    const fetchToken = async (): Promise<TokenType | void> => {
      const cachedToken = this.getCachedToken();
      const hasExpired = this.hasTokenExpired(cachedToken.expiresIn);

      // Refresh token if it's about to expire (within 5 minutes)
      const shouldRefresh = cachedToken.accessToken && 
        (hasExpired || cachedToken.expiresIn < Date.now() + 300000);

      if (cachedToken.accessToken && !shouldRefresh) {
        console.log("[IGDB] Using cached token");
        this.clientAccessToken = cachedToken.accessToken;
        return cachedToken;
      }

      console.log("[IGDB] Fetching new token");
      try {
        const newToken = cachedToken.accessToken
          ? await this.renewToken()
          : await this.getNewToken();
        
        if (!newToken.accessToken) {
          console.error("[IGDB] Failed to get a new token");
          return;
        }

        this.clientAccessToken = newToken.accessToken;
        return newToken;
      } catch (error) {
        console.error("[IGDB] Failed to refresh token:", error);
        throw error;
      } finally {
        this.gettingAccessToken = false;
      }
    };

    try {
      return await fetchToken();
    } catch (error) {
      console.error("[IGDB] Critical token refresh failure:", error);
      throw error;
    } finally {
      this.gettingAccessToken = false;
    }
  }

  async search(query: string, limit?: number): Promise<IGDBReturnDataType[]> {
    const realQuery = query;
    // const findEasterEgg = searchEasterEggs.find(
    //   (egg) => egg.name === query.toLowerCase()
    // );
    // if (findEasterEgg) realQuery = findEasterEgg.query;

    const data = await this.request<IGDBReturnDataType[]>("games", {
      search: realQuery,
      where: `platforms.abbreviation = "PC" & version_parent = null`,
      limit: limit?.toString() ?? undefined,
    });

    return data;
  }

  async info(id: string): Promise<InfoReturn> {
    const igdbData = await this.request<IGDBReturnDataType[]>("games", {
      where: `id = ${id}`,
      limit: "1",
    });

    const item = igdbData[0];

    const steam_id = getSteamIdFromWebsites(item.websites);

    const steam = steam_id ? await this.steamStoreInfo(steam_id) : null;

    const returnData: InfoReturn = {
      ...item,
      steam,
    };

    return returnData;
  }

  async mostAnticipated(
    limit?: number,
    offset?: number
  ): Promise<IGDBReturnDataType[]> {
    const DateNow = (new Date().getTime() / 1000).toFixed();
    return await this.request<IGDBReturnDataType[]>("games", {
      sort: "hypes desc",
      where: `platforms.abbreviation = "PC" & hypes != n & first_release_date > ${DateNow} & category = 0`,
      limit: limit?.toString() ?? undefined,
      offset: offset?.toString() ?? undefined,
    });
  }

  async newReleases(
    limit?: number,
    offset?: number
  ): Promise<IGDBReturnDataType[]> {
    const DateNow = (new Date().getTime() / 1000).toFixed();
    return await this.request<IGDBReturnDataType[]>("games", {
      sort: "first_release_date desc",
      where: `platforms.abbreviation = "PC" & hypes != n & first_release_date < ${DateNow} & category = 0 & version_parent = null`,
      limit: limit?.toString() ?? undefined,
      offset: offset?.toString() ?? undefined,
    });
  }

  async topRated(
    limit?: number,
    offset?: number
  ): Promise<IGDBReturnDataType[]> {
    return await this.request<IGDBReturnDataType[]>("games", {
      sort: "aggregated_rating  desc",
      where: `platforms.abbreviation = "PC" & aggregated_rating != n & aggregated_rating_count > 7 & version_parent = null & category = 0`,
      limit: limit?.toString() ?? undefined,
      offset: offset?.toString() ?? undefined,
    });
  }

  async request<T = unknown>(
    reqUrl: "games" | "genres" | "themes",
    options: {
      fields?: string[];
      where?: string;
      search?: string;
      sort?: string;
      limit?: string;
      offset?: string;
    },
    includeDefaultFields: boolean = true
  ): Promise<T> {
    while (this.gettingAccessToken) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    try {
      await this.getAccessToken();

      // Construct the request body
      let requestBody = "";
      const fields = options.fields || [];
      if (includeDefaultFields) {
        requestBody += `fields ${[...fields,...defaultFields].join(",")};`;
      } else {
        requestBody += `fields ${fields.join(",")};`;
      }
      
      if (options.sort) {
        requestBody += ` sort ${options.sort};`;
      }
      if (options.limit) {
        requestBody += ` limit ${options.limit};`;
      }
      if (options.offset) {
        requestBody += ` offset ${options.offset};`;
      }
      if (options.search) {
        requestBody += ` search "${options.search}";`;
      }
      if (options.where) {
        requestBody += ` where ${options.where};`;
      }

      // Add other options as needed

      const res = await this.makeReq<T>(`https://api.igdb.com/v4/${reqUrl}`, {
        method: "POST",
        headers: {
          "Client-ID": this.clientId,
          Authorization: `Bearer ${this.clientAccessToken}`,
        },
        body: requestBody ? requestBody : undefined,
      });

      return res;
    } catch (error) {
      console.log(error);
      throw new Error((error as Error).message);
    }
  }

  async steamStoreInfo(appid: string) {
    try {
      const url = `https://store.steampowered.com/api/appdetails/?appids=${appid}`;
      const res = await this.makeReq<ApiResponse>(url);

      return res[appid];
    } catch (error) {
      console.error(error);
    }
  }
}

const igdb = new IGDB();
export { igdb, genreAPI };
