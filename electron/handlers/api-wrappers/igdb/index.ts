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
	private readonly PC_PLATFORMS = [3, 6, 14];

	private constructor() {
		super(env.VITE_TWITCH_CLIENT_ID ?? "", env.VITE_TWITCH_CLIENT_SECRET ?? "");
	}

	public static getInstance(): IGDBWrapper {
		if (!IGDBWrapper.instance) {
			IGDBWrapper.instance = new IGDBWrapper();
		}
		return IGDBWrapper.instance;
	}

	/**
	 * Fetches available genres from IGDB without default fields.
	 * @param limit number of items to return
	 * @param offset starting offset
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
	 * Fetches available themes from IGDB without default fields.
	 * @param limit number of items to return
	 * @param offset starting offset
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

	async info(id: string): Promise<InfoReturn | undefined> {
		if (!id) throw new Error("Game ID is required");
		const igdbData = await this.makeReq<IGDBReturnDataType[]>("games", {
			where: `id = ${id} & ${this.getPlatformCondition()}`,
			limit: 1,
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

		return await this.makeReq<IGDBReturnDataType[]>("games", {
			where: `first_release_date >= ${threeMonthsAgo} & first_release_date <= ${
				now
			} & rating_count >= ${MIN_RATING_COUNT} & ${this.getPlatformCondition()}`,
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

	async byGenre(
		genre: string,
		limit = DEFAULT_LIMIT,
		offset = 0,
	): Promise<IGDBReturnDataType[]> {
		if (!genre) throw new Error("Genre is required");
		return this.makeReq<IGDBReturnDataType[]>("games", {
			where: `genres.name = \"${genre}\" & aggregated_rating_count >= ${MIN_RATING_COUNT} & ${this.getPlatformCondition()}`,
			sort: "aggregated_rating desc",
			limit,
			offset,
		});
	}

	async topRatedNewReleases(
		limit = DEFAULT_LIMIT,
		offset = 0,
		minRating = 75,
	): Promise<IGDBReturnDataType[]> {
		this.validateRating(minRating);
		const now = Math.floor(Date.now() / 1000);
		const threeMonthsAgo = now - 7776000;
		return this.makeReq<IGDBReturnDataType[]>("games", {
			where: `first_release_date >= ${threeMonthsAgo} & first_release_date <= ${now} & aggregated_rating >= ${minRating} & aggregated_rating_count >= ${MIN_RATING_COUNT} & category = 0 & version_parent = null & ${this.getPlatformCondition()}`,
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
		if (
			!gameInfo ||
			!gameInfo.similar_games ||
			gameInfo.similar_games.length === 0
		) {
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

	async byMultipleGenres(
		genreIds: number[],
		limit = DEFAULT_LIMIT,
		offset = 0,
	): Promise<IGDBReturnDataType[]> {
		if (!genreIds || genreIds.length === 0)
			throw new Error("At least one genre ID is required");

		const genreCondition = `genres = {${genreIds.join(",")}}`;

		return this.makeReq<IGDBReturnDataType[]>("games", {
			where: `${genreCondition} & aggregated_rating_count >= ${MIN_RATING_COUNT} & ${this.getPlatformCondition()}`,
			sort: "aggregated_rating desc",
			limit,
			offset,
		});
	}

	async steamStoreInfo(appid: string) {
		try {
			const url = `https://store.steampowered.com/api/appdetails/?appids=${appid}`;
			const fetched = await fetch(url);
			const res = (await fetched.json()) as SteamApiResponse;

			return res[appid];
		} catch (error) {
			console.error(error);
		}
	}

	async filter(
		filters: GameFilters,
		sort?: string,
		limit = DEFAULT_LIMIT,
		offset = 0,
	): Promise<IGDBReturnDataType[]> {
		const conditions: string[] = [];

		conditions.push(this.getPlatformCondition(filters.platforms));

		if (filters.genreIds && filters.genreIds.length > 0) {
			conditions.push(`genres = {${filters.genreIds.join(",")}}`);
		}

		if (filters.themes && filters.themes.length > 0) {
			conditions.push(`themes = {${filters.themes.join(",")}}`);
		}
		if (filters.gameModes && filters.gameModes.length > 0) {
			conditions.push(`game_modes = {${filters.gameModes.join(",")}}`);
		}
		if (
			filters.playerPerspectiveIds &&
			filters.playerPerspectiveIds.length > 0
		) {
			conditions.push(
				`player_perspectives = {${filters.playerPerspectiveIds.join(",")}}`,
			);
		}

		if (typeof filters.minRating === "number") {
			this.validateRating(filters.minRating);
			conditions.push(`aggregated_rating >= ${filters.minRating}`);
			conditions.push("aggregated_rating != null");
		}
		if (typeof filters.maxRating === "number") {
			this.validateRating(filters.maxRating);
			conditions.push(`aggregated_rating <= ${filters.maxRating}`);
			conditions.push("aggregated_rating != null");
		}
		if (
			typeof filters.minRatingCount === "number" &&
			filters.minRatingCount >= 0
		) {
			conditions.push(`aggregated_rating_count >= ${filters.minRatingCount}`);
		}

		if (typeof filters.releaseDateFrom === "number") {
			const fromSec = Math.floor(filters.releaseDateFrom / 1000);
			conditions.push(`release_dates.date >= ${fromSec}`);
			conditions.push("release_dates.date != null");
		}

		if (typeof filters.releaseDateTo === "number") {
			const toSec = Math.floor(filters.releaseDateTo / 1000);
			conditions.push(`release_dates.date <= ${toSec}`);
		}

		if (typeof filters.minHypes === "number" && filters.minHypes > 0) {
			conditions.push(`hypes >= ${filters.minHypes}`);
			conditions.push("hypes != null");
		}

		if (filters.onlyMainGames === true) {
			conditions.push("category = 0");
		}
		if (filters.excludeVersions === true) {
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
