import { setTimeout } from "node:timers/promises";
import type { GetPlayerSummariesResponse, SteamProfile } from "./@types";

const { VITE_STEAM_API_KEY } = import.meta.env;

export class SteamApi {
	private static instance: SteamApi;

	private readonly apiKey: string;
	private readonly baseUrl = "https://api.steampowered.com";

	private constructor() {
		if (!VITE_STEAM_API_KEY) {
			throw new Error(
				"VITE_STEAM_API_KEY is not set in environment variables.",
			);
		}
		this.apiKey = VITE_STEAM_API_KEY;
	}

	/**
	 * Get the singleton instance of the SteamApi class.
	 */
	static getInstance(): SteamApi {
		if (!SteamApi.instance) {
			SteamApi.instance = new SteamApi();
		}
		return SteamApi.instance;
	}

	/**
	 * A centralized request handler with exponential backoff and jitter.
	 * @param url The URL to fetch.
	 * @param options The options for the fetch request.
	 * @param retries The number of retries to attempt.
	 */
	private async request<T>(
		url: URL,
		options: RequestInit = {},
		retries = 3,
	): Promise<T> {
		let attempt = 0;
		while (attempt < retries) {
			try {
				const res = await fetch(url.toString(), options);

				if (res.status === 429) {
					// Too Many Requests
					const delay = 2 ** attempt * 1000 + Math.random() * 1000;
					console.warn(`Rate limited. Retrying in ${delay.toFixed(0)}ms...`);
					await setTimeout(delay);
					attempt++;
					continue;
				}

				if (!res.ok) {
					throw new Error(
						`API request failed: ${res.status} ${res.statusText}`,
					);
				}

				// Handle cases where the response might not be JSON
				const contentType = res.headers.get("content-type");
				if (contentType?.includes("application/json")) {
					return (await res.json()) as T;
				}
				return (await res.text()) as T;
			} catch (error) {
				if (attempt >= retries - 1) {
					throw error; // Rethrow the last error
				}
				attempt++;
			}
		}
		throw new Error("Request failed after multiple retries.");
	}

	/**
	 * Generate the Steam OpenID login URL.
	 * @param returnTo URL Steam should redirect back to
	 */
	getLoginUrl(returnTo: string): string {
		const url = new URL("https://steamcommunity.com/openid/login");
		url.searchParams.set("openid.ns", "http://specs.openid.net/auth/2.0");
		url.searchParams.set("openid.mode", "checkid_setup");
		url.searchParams.set(
			"openid.claimed_id",
			"http://specs.openid.net/auth/2.0/identifier_select",
		);
		url.searchParams.set(
			"openid.identity",
			"http://specs.openid.net/auth/2.0/identifier_select",
		);
		url.searchParams.set("openid.return_to", returnTo);
		url.searchParams.set("openid.realm", returnTo);
		return url.toString();
	}

	/**
	 * Validate the OpenID callback params, fetch the SteamID and return
	 * the full SteamProfile.
	 * @param params the req.query object from the callback route
	 */
	async loginWithSteam(params: Record<string, string>): Promise<SteamProfile> {
		const verify = new URLSearchParams();
		for (const [k, v] of Object.entries(params)) {
			if (k.startsWith("openid.")) {
				verify.set(k, v);
			}
		}
		verify.set("openid.mode", "check_authentication");

		const body = await this.request<string>(
			new URL("https://steamcommunity.com/openid/login"),
			{
				method: "POST",
				body: verify,
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
			},
		);

		if (!/is_valid\s*:\s*true/.test(body)) {
			throw new Error("OpenID signature invalid");
		}

		const claimed = params["openid.claimed_id"];
		if (!claimed) {
			throw new Error("Missing openid.claimed_id");
		}
		const steamId = claimed.split("/").pop();

		if (!steamId) {
			throw new Error("Invalid SteamID");
		}

		const psUrl = new URL(`${this.baseUrl}/ISteamUser/GetPlayerSummaries/v2/`);
		psUrl.searchParams.set("key", this.apiKey);
		psUrl.searchParams.set("steamids", steamId);

		const json = await this.request<GetPlayerSummariesResponse>(psUrl);
		const player = json.response.players[0];

		if (!player) {
			throw new Error("Steam returned no player data");
		}
		return player;
	}

	/**
	 * Resolve a vanity URL (custom username) to a 64-bit SteamID.
	 * @param vanityUrl The part after /id/ in a profile URL
	 * @returns SteamID64
	 */
	async getSteamId(vanityUrl: string): Promise<string> {
		const url = new URL(`${this.baseUrl}/ISteamUser/ResolveVanityURL/v1/`);
		url.searchParams.set("key", this.apiKey);
		url.searchParams.set("vanityurl", vanityUrl);

		const json = await this.request<{
			response: { success: number; steamid?: string; message?: string };
		}>(url);

		if (json.response.success !== 1 || !json.response.steamid) {
			throw new Error(
				`Could not resolve vanity URL: ${json.response.message || "unknown"}`,
			);
		}
		return json.response.steamid;
	}
}
