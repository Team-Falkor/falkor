import type { GetPlayerSummariesResponse, SteamProfile } from "./@types";

const { VITE_STEAM_API_KEY } = import.meta.env;

export class SteamApi {
	private static instance: SteamApi;

	private readonly apiKey: string;
	private readonly baseUrl = "https://api.steampowered.com";

	private constructor() {
		this.apiKey = VITE_STEAM_API_KEY;
	}

	/**
	 * Get the singleton instance of the SteamApi class.
	 */
	static getInstance(): SteamApi {
		if (!SteamApi.instance) SteamApi.instance = new SteamApi();
		return SteamApi.instance;
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
		// repost all openid.* params plus mode=check_authentication
		const verify = new URLSearchParams();
		for (const [k, v] of Object.entries(params)) {
			if (k.startsWith("openid.")) verify.set(k, v);
		}
		verify.set("openid.mode", "check_authentication");

		const res = await fetch("https://steamcommunity.com/openid/login", {
			method: "POST",
			body: verify,
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
		});
		if (!res.ok) {
			throw new Error(`OpenID verification failed: ${res.statusText}`);
		}
		const body = await res.text();
		if (!/is_valid\s*:\s*true/.test(body)) {
			throw new Error("OpenID signature invalid");
		}

		// extract SteamID from claimed_id
		const claimed = params["openid.claimed_id"];
		if (!claimed) {
			throw new Error("Missing openid.claimed_id");
		}
		const steamId = claimed.split("/").pop();

		if (!steamId) {
			throw new Error("Invalid SteamID");
		}

		// fetch user profile
		const psUrl = new URL(`${this.baseUrl}/ISteamUser/GetPlayerSummaries/v2/`);
		psUrl.searchParams.set("key", this.apiKey);
		psUrl.searchParams.set("steamids", steamId);

		const psRes = await fetch(psUrl.toString());
		if (!psRes.ok) {
			throw new Error(
				`GetPlayerSummaries failed: ${psRes.status} ${psRes.statusText}`,
			);
		}
		const json = (await psRes.json()) as GetPlayerSummariesResponse;
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

		const res = await fetch(url.toString());
		if (!res.ok) {
			throw new Error(
				`ResolveVanityURL failed: ${res.status} ${res.statusText}`,
			);
		}
		const json = (await res.json()) as {
			response: { success: number; steamid?: string; message?: string };
		};
		if (json.response.success !== 1 || !json.response.steamid) {
			throw new Error(
				`Could not resolve vanity URL: ${json.response.message || "unknown"}`,
			);
		}
		return json.response.steamid;
	}
}
