import type { RealDebridUser } from "@/@types";

export class RealDebridUserService {
	constructor(
		private readonly baseUrl: string,
		private readonly accessToken: string,
	) {}

	public async getUserInfo(): Promise<RealDebridUser> {
		const response = await fetch(`${this.baseUrl}/user`, {
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to get user info: ${response.statusText}`);
		}

		return response.json();
	}

	public async getTrafficDetails(): Promise<
		Record<
			string,
			{
				left: number;
				bytes: number;
				links: number;
				limit: number;
				type: "links" | "gigabytes" | "bytes";
				extra: number;
				reset: "daily" | "weekly" | "monthly";
			}
		>
	> {
		const response = await fetch(`${this.baseUrl}/user/traffic`, {
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to get traffic details: ${response.statusText}`);
		}

		return response.json();
	}

	public async getDownloadHistory(): Promise<
		Array<{
			id: string;
			filename: string;
			mimeType: string;
			filesize: number;
			link: string;
			host: string;
			chunks: number;
			download: string;
			generated: string;
			type?: string;
		}>
	> {
		const response = await fetch(`${this.baseUrl}/downloads`, {
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to get download history: ${response.statusText}`);
		}

		return response.json();
	}
}
