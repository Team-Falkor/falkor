import { RealDebridAuthService } from "./services/auth";
import { RealDebridTorrentService } from "./services/torrents";
import { RealDebridUnrestrictService } from "./services/unrestrict";
import { RealDebridUserService } from "./services/user";

class RealDebridClient {
	private static instance: RealDebridClient | null = null;
	private readonly accessToken: string;
	private readonly baseUrl = "https://api.real-debrid.com/rest/1.0";

	public readonly unrestrict: RealDebridUnrestrictService;
	public readonly user: RealDebridUserService;
	public readonly torrents: RealDebridTorrentService;

	private constructor(accessToken: string) {
		this.accessToken = accessToken;
		this.unrestrict = new RealDebridUnrestrictService(
			this.baseUrl,
			this.accessToken,
		);
		this.user = new RealDebridUserService(this.baseUrl, this.accessToken);
		this.torrents = new RealDebridTorrentService(
			this.baseUrl,
			this.accessToken,
		);
	}

	public static getInstance(accessToken: string): RealDebridClient {
		if (!RealDebridClient.instance) {
			RealDebridClient.instance = new RealDebridClient(accessToken);
		}
		return RealDebridClient.instance;
	}

	public static destroyInstance(): void {
		RealDebridClient.instance = null;
	}

	protected async makeRequest<T>(
		endpoint: string,
		options: RequestInit = {},
	): Promise<T> {
		const headers = new Headers({
			Authorization: `Bearer ${this.accessToken}`,
			"Content-Type": "application/json",
		});

		const response = await fetch(`${this.baseUrl}${endpoint}`, {
			...options,
			headers,
		});

		if (!response.ok) {
			throw new Error(`Real-Debrid API error: ${response.statusText}`);
		}

		return response.json();
	}
}

export { RealDebridAuthService, RealDebridClient };
