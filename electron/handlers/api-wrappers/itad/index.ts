import type {
	ITADGameInfo,
	ITADGameLookup,
	ITADGameSearch,
	ITADPrice,
} from "@/@types";

const { VITE_ITAD_API_KEY } = import.meta.env;

export class ITAD {
	static instance: ITAD;

	protected readonly baseUrl: string = "https://api.isthereanydeal.com";
	protected readonly apiKey: string;

	constructor() {
		if (!VITE_ITAD_API_KEY)
			throw new Error("VITE_ITAD_API_KEY is not set, cannot use ITAD");
		this.apiKey = VITE_ITAD_API_KEY ?? "";
	}

	static getInstance(): ITAD {
		if (!ITAD.instance) {
			ITAD.instance = new ITAD();
		}
		return ITAD.instance;
	}

	async gameSearch(query: string): Promise<Array<ITADGameSearch>> {
		return await this.request<Array<ITADGameSearch>>(
			"games/search/v1",
			{
				method: "GET",
			},
			{
				title: query,
			},
		);
	}

	async gameLookup(id: string | number): Promise<ITADGameLookup> {
		return await this.request<ITADGameLookup>(
			"games/lookup/v1",
			{ method: "GET" },
			typeof id === "string" ? { title: id } : { appid: id.toString() },
		);
	}

	async gameInfo(id: string): Promise<ITADGameInfo> {
		return await this.request<ITADGameInfo>(
			"games/info/v2",
			{ method: "GET" },
			{ id: id },
		);
	}

	async gamePrices(id: string[], country = "US"): Promise<ITADPrice[]> {
		const response = await this.request<Array<ITADPrice>>(
			"games/prices/v2",
			{
				method: "POST",
				body: JSON.stringify(id),
			},
			{
				country: country,
				capacity: "8",
				nondeals: "true",
				vouchers: "true",
			},
		);

		return response;
	}

	async request<T>(
		url: string,
		options: RequestInit,
		params: Record<string, string> = {},
	): Promise<T> {
		try {
			const real_url = new URL(url, this.baseUrl);
			real_url.searchParams.set("key", this.apiKey);

			for (const [key, value] of Object.entries(params)) {
				real_url.searchParams.set(key, value);
			}

			const data = await fetch(real_url.href, options);

			return (await data.json()) as T;
		} catch (error) {
			console.error(error);
			throw new Error(`Failed to fetch ${url}: ${error}`);
		}
	}
}
