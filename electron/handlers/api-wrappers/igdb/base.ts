import { getErrorMessage } from "@backend/utils/utils";
import type { IGDBAccessTokenResponse } from "@/@types";
import { defaultFields } from "./constants";

// Define types for IGDB API requests
export type IGDBEndpoint = "games" | "genres" | "themes" | "game_modes";

export interface IGDBRequestOptions {
	fields?: string[];
	/**
	 * Include default fields defined in constants.defaultFields
	 * @default true
	 */
	includeDefaultFields?: boolean;
	where?: string;
	search?: string;
	sort?: string;
	limit?: number;
	offset?: number;
}

class IGDBApiBase {
	private clientId: string;
	private clientSecret: string;
	private clientAccessToken?: string;
	private tokenExpiration = 0;

	// Promise guard to prevent simultaneous token fetches
	private tokenPromise?: Promise<string>;

	constructor(clientId: string, clientSecret: string) {
		this.clientId = clientId;
		this.clientSecret = clientSecret;
	}

	/**
	 * Fetches a new access token from Twitch and updates internal state.
	 */
	private async fetchAccessToken(): Promise<string> {
		const response = await fetch(
			`https://id.twitch.tv/oauth2/token?client_id=${this.clientId}&client_secret=${this.clientSecret}&grant_type=client_credentials`,
			{ method: "POST" },
		);

		if (!response.ok) {
			throw new Error("Failed to fetch access token");
		}

		const json = (await response.json()) as IGDBAccessTokenResponse;
		console.log("Fetching a new access token");

		this.clientAccessToken = json.access_token;
		this.tokenExpiration = Date.now() + json.expires_in * 1000;
		return this.clientAccessToken;
	}

	/**
	 * Ensures a valid access token is available, fetching a new one if needed.
	 * Uses a single promise guard to prevent concurrent fetches.
	 */
	private async ensureAccessToken(): Promise<string> {
		// If token is valid (with slight buffer), return it
		if (
			this.clientAccessToken &&
			Date.now() < this.tokenExpiration - 100 * 1000
		) {
			return this.clientAccessToken;
		}

		// If a token fetch is already in progress, wait for it
		if (!this.tokenPromise) {
			// Start a new token fetch
			this.tokenPromise = this.fetchAccessToken().finally(() => {
				// Clear the promise so future calls can trigger refresh
				this.tokenPromise = undefined;
			});
		}

		return this.tokenPromise;
	}

	/**
	 * Makes a request to the IGDB API
	 * @param endpoint The IGDB API endpoint
	 * @param options Request options including fields, filters, and pagination
	 * @returns Promise with the API response data
	 */
	public async makeReq<T = unknown>(
		endpoint: IGDBEndpoint,
		options: Partial<IGDBRequestOptions>,
	): Promise<T> {
		try {
			const token = await this.ensureAccessToken();

			// Destructure options with default for includeDefaultFields
			const {
				fields = [],
				includeDefaultFields = true,
				sort,
				limit,
				offset,
				search,
				where,
			} = options;

			// Build the fields clause, merging defaultFields if enabled
			const selectedFields = includeDefaultFields
				? [...fields, ...defaultFields]
				: fields;

			// Construct the request body
			let requestBody = `fields ${selectedFields.join(",")} ;`;
			if (sort) requestBody += ` sort ${sort};`;
			if (limit !== undefined) {
				const l = Math.max(1, Math.min(limit, 500));
				requestBody += ` limit ${l};`;
			}
			if (offset !== undefined) {
				const o = Math.max(0, offset);
				requestBody += ` offset ${o};`;
			}
			if (search) requestBody += ` search "${search}";`;
			if (where) requestBody += ` where ${where};`;

			const res = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
				method: "POST",
				headers: {
					"Client-ID": this.clientId,
					Authorization: `Bearer ${token}`,
				},
				body: requestBody,
				cache: "no-cache",
			});

			if (!res.ok) {
				const errorText = await res.text().catch(() => "Unknown error");
				throw new Error(`IGDB API error (${res.status}): ${errorText}`);
			}

			return (await res.json()) as T;
		} catch (error) {
			console.error("IGDB API request failed:", error);
			throw new Error(
				getErrorMessage(error, "Failed to fetch data from IGDB API"),
			);
		}
	}
}

export default IGDBApiBase;
