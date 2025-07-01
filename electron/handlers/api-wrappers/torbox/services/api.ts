export class TorBoxAPI {
	private baseUrl: string;
	public accessToken: string;

	constructor(accessToken: string) {
		if (!accessToken) throw new Error("No access token provided");
		this.accessToken = accessToken;

		this.baseUrl = "https://api.torbox.app/v1/api/";
	}

	async makeRequest<T>(
		endpoint: string,
		method: "GET" | "POST" | "HEAD" = "GET",
		authRequired = true,
		body?: BodyInit,
		headersInit?: HeadersInit,
	): Promise<T> {
		const url = `${this.baseUrl}${endpoint}`;
		const headers: HeadersInit = {
			...(authRequired ? { Authorization: `Bearer ${this.accessToken}` } : {}),
			...headersInit,
		};

		const res = await fetch(url, { method, headers, body });
		const text = await res.text();
		if (!text) throw new Error("Torbox: No data returned from API");
		return JSON.parse(text);
	}
}
