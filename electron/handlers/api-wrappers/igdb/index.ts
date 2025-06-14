import type {
	IGDBReturnDataType,
	InfoReturn,
	SteamApiResponse,
	Website,
} from "@/@types";
import IGDBApiBase from "./base";

const DEFAULT_LIMIT = 20;
const MIN_RATING_COUNT = 7;

const env = import.meta.env;

export const getSteamIdFromUrl = (url: string) =>
	url.match(/\/app\/(\d+)(\/|$)/)?.[1];

export const getSteamIdFromWebsites = (websites: Website[]) => {
	const find_steam_url = websites?.find((site) =>
		site.url.startsWith("https://store.steampowered.com/app"),
	);

	if (!find_steam_url) return undefined;

	return getSteamIdFromUrl(find_steam_url?.url);
};

export interface GameFilters {
	platforms?: number[];
	genreIds?: number[];
	themes?: number[];
	gameModes?: number[];
	playerPerspectiveIds?: number[];
	minRating?: number;
	maxRating?: number;
	minRatingCount?: number;
	// Use JS Date timestamps (milliseconds) for these properties
	releaseDateFrom?: number;
	releaseDateTo?: number;
	minHypes?: number;
	onlyMainGames?: boolean;
	excludeVersions?: boolean;
}

export interface IGDBOption {
	id: number;
	name: string;
}

export class IGDBWrapper extends IGDBApiBase {
	private static instance: IGDBWrapper;
	private readonly PC_PLATFORMS = [6, 14, 3];

	private constructor() {
		super(env.VITE_TWITCH_CLIENT_ID ?? "", env.VITE_TWITCH_CLIENT_SECRET ?? "");
	}

	public static getInstance(): IGDBWrapper {
		if (!IGDBWrapper.instance) {
			IGDBWrapper.instance = new IGDBWrapper();
		}
		return IGDBWrapper.instance;
	}

	private getPlatformCondition(platformIds?: number[]): string {
		const platformsToUse =
			platformIds && platformIds.length > 0 ? platformIds : this.PC_PLATFORMS;
		return `platforms = (${platformsToUse.join(",")})`;
	}

	private validateRating(rating: number): void {
		if (rating < 0 || rating > 100) {
			throw new Error("Rating must be between 0 and 100");
		}
	}

	/**
	 * Fetches available genres from IGDB.
	 */
	public async getGenres(
		limit = DEFAULT_LIMIT,
		offset = 0,
	): Promise<IGDBOption[]> {
		return this.makeReq<IGDBOption[]>("genres", {
			fields: ["id", "name"],
			includeDefaultFields: false,
			sort: "name asc",
			limit,
			offset,
		});
	}

	/**
	 * Fetches available themes from IGDB.
	 */
	public async getThemes(
		limit = DEFAULT_LIMIT,
		offset = 0,
	): Promise<IGDBOption[]> {
		return this.makeReq<IGDBOption[]>("themes", {
			fields: ["id", "name"],
			includeDefaultFields: false,
			sort: "name asc",
			limit,
			offset,
		});
	}

	async info(id: string): Promise<InfoReturn | undefined> {
		if (!id) throw new Error("Game ID is required");
		const igdbData = await this.makeReq<IGDBReturnDataType[]>("games", {
			where: `id = ${id}`,
			limit: 1,
		});

		const item = igdbData[0];
		if (!item) return undefined;

		const steam_id = getSteamIdFromWebsites(item.websites);
		const steam = steam_id ? await this.steamStoreInfo(steam_id) : null;

		return { ...item, steam };
	}

	async search(
		query: string,
		limit = DEFAULT_LIMIT,
		offset = 0,
	): Promise<IGDBReturnDataType[]> {
		if (!query) throw new Error("Search query is required");
		return this.makeReq<IGDBReturnDataType[]>("games", {
			search: query,
			where: this.getPlatformCondition(),
			limit,
			offset,
		});
	}

	async mostAnticipated(
		limit = DEFAULT_LIMIT,
		offset = 0,
	): Promise<IGDBReturnDataType[]> {
		const now = Math.floor(Date.now() / 1000);
		return this.makeReq<IGDBReturnDataType[]>("games", {
			where: `hypes != null & first_release_date > ${now} & ${this.getPlatformCondition()}`,
			sort: "hypes desc",
			limit,
			offset,
		});
	}

	async newReleases(
		limit = DEFAULT_LIMIT,
		offset = 0,
	): Promise<IGDBReturnDataType[]> {
		const now = Math.floor(Date.now() / 1000);
		const threeMonthsAgo = now - 7776000; // 90 days in seconds

		return this.makeReq<IGDBReturnDataType[]>("games", {
			where: `first_release_date >= ${threeMonthsAgo} & first_release_date <= ${now} & rating_count >= ${MIN_RATING_COUNT} & ${this.getPlatformCondition()}`,
			sort: "first_release_date desc",
			limit,
			offset,
		});
	}

	async topRated(
		limit = DEFAULT_LIMIT,
		offset = 0,
	): Promise<IGDBReturnDataType[]> {
		return this.makeReq<IGDBReturnDataType[]>("games", {
			where: `aggregated_rating != null & aggregated_rating_count > ${MIN_RATING_COUNT} & category = 0 & version_parent = null & ${this.getPlatformCondition()}`,
			sort: "aggregated_rating desc",
			limit,
			offset,
		});
	}

	/**
	 * Finds top-rated games within a specific genre by its name.
	 */
	async byGenre(
		genre: string,
		limit = DEFAULT_LIMIT,
		offset = 0,
	): Promise<IGDBReturnDataType[]> {
		if (!genre) throw new Error("Genre is required");
		return this.makeReq<IGDBReturnDataType[]>("games", {
			where: `genres.name = "${genre}" & aggregated_rating_count >= ${MIN_RATING_COUNT} & ${this.getPlatformCondition()}`,
			sort: "aggregated_rating desc",
			limit,
			offset,
		});
	}

	/**
	 * Finds games that have *any* of the specified genre IDs (OR condition).
	 */
	async byMultipleGenres(
		genreIds: number[],
		limit = DEFAULT_LIMIT,
		offset = 0,
	): Promise<IGDBReturnDataType[]> {
		if (!genreIds || genreIds.length === 0) {
			throw new Error("At least one genre ID is required");
		}
		// Note: `[id1, id2]` is an OR condition (contains any).
		const genreCondition = `genres = [${genreIds.join(",")}]`;

		return this.makeReq<IGDBReturnDataType[]>("games", {
			where: `${genreCondition} & aggregated_rating_count >= ${MIN_RATING_COUNT} & ${this.getPlatformCondition()}`,
			sort: "aggregated_rating desc",
			limit,
			offset,
		});
	}

	async similarGames(
		gameId: string,
		limit = DEFAULT_LIMIT,
		offset = 0,
	): Promise<IGDBReturnDataType[]> {
		if (!gameId) throw new Error("Game ID is required");
		const gameInfo = await this.info(gameId);
		if (!gameInfo?.similar_games?.length) {
			return [];
		}
		const similarGameIds = gameInfo.similar_games
			.map((g) => (typeof g === "number" ? g : g.id))
			.join(",");

		return this.makeReq<IGDBReturnDataType[]>("games", {
			where: `id = (${similarGameIds}) & aggregated_rating_count >= ${MIN_RATING_COUNT} & ${this.getPlatformCondition()}`,
			sort: "aggregated_rating desc",
			limit,
			offset,
		});
	}

	async steamStoreInfo(appid: string) {
		try {
			const url = `https://store.steampowered.com/api/appdetails/?appids=${appid}`;
			const fetched = await fetch(url);
			if (!fetched.ok) {
				throw new Error(
					`Steam API request failed with status ${fetched.status}`,
				);
			}
			const res = (await fetched.json()) as SteamApiResponse;
			return res[appid];
		} catch (error) {
			console.error("Failed to fetch Steam store info:", error);
			return null;
		}
	}

	/**
	 * Filters games based on a combination of criteria.
	 * This method uses AND logic for combining filters.
	 */
	async filter(
		filters: GameFilters,
		sort?: string,
		limit = DEFAULT_LIMIT,
		offset = 0,
	): Promise<IGDBReturnDataType[]> {
		const conditions: string[] = [this.getPlatformCondition(filters.platforms)];

		// Helper for array conditions. Uses `(id1,id2)` for AND logic.
		const addArrayCondition = (field: string, ids?: number[]) => {
			if (ids && ids.length > 0) {
				conditions.push(`${field} = (${ids.join(",")})`);
			}
		};

		addArrayCondition("genres", filters.genreIds);
		addArrayCondition("themes", filters.themes);
		addArrayCondition("game_modes", filters.gameModes);
		addArrayCondition("player_perspectives", filters.playerPerspectiveIds);

		if (typeof filters.minRating === "number") {
			this.validateRating(filters.minRating);
			conditions.push(`aggregated_rating >= ${filters.minRating}`);
		}
		if (typeof filters.maxRating === "number") {
			this.validateRating(filters.maxRating);
			conditions.push(`aggregated_rating <= ${filters.maxRating}`);
		}
		if (
			typeof filters.minRatingCount === "number" &&
			filters.minRatingCount >= 0
		) {
			conditions.push(`aggregated_rating_count >= ${filters.minRatingCount}`);
		}

		// Use `first_release_date` for more reliable date filtering.
		// Assumes input is a JS timestamp (in milliseconds).
		if (typeof filters.releaseDateFrom === "number") {
			const fromSec = Math.floor(filters.releaseDateFrom / 1000);
			conditions.push(`first_release_date >= ${fromSec}`);
		}
		if (typeof filters.releaseDateTo === "number") {
			const toSec = Math.floor(filters.releaseDateTo / 1000);
			conditions.push(`first_release_date <= ${toSec}`);
		}

		if (typeof filters.minHypes === "number" && filters.minHypes > 0) {
			conditions.push(`hypes >= ${filters.minHypes}`);
		}

		if (filters.onlyMainGames) {
			conditions.push("category = 0");
		}
		if (filters.excludeVersions) {
			conditions.push("version_parent = null");
		}

		const whereClause = conditions.join(" & ");
		const sortClause = sort ?? "popularity desc";

		return this.makeReq<IGDBReturnDataType[]>("games", {
			where: whereClause,
			sort: sortClause,
			limit,
			offset,
		});
	}
}
