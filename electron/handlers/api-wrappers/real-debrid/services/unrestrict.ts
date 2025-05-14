import type {
	RealDebridUnrestrictCheck,
	RealDebridUnrestrictFileFolder,
} from "@/@types";

export class RealDebridUnrestrictService {
	constructor(
		private readonly baseUrl: string,
		private readonly accessToken: string,
	) {}

	public async checkLink(link: string): Promise<RealDebridUnrestrictCheck> {
		const response = await fetch(`${this.baseUrl}/unrestrict/check`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: `link=${encodeURIComponent(link)}`,
		});

		if (!response.ok) {
			throw new Error(`Failed to check link: ${response.statusText}`);
		}

		return response.json();
	}

	public async unrestrictLink(
		link: string,
	): Promise<RealDebridUnrestrictFileFolder> {
		const response = await fetch(`${this.baseUrl}/unrestrict/link`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: `link=${encodeURIComponent(link)}`,
		});

		if (!response.ok) {
			throw new Error(`Failed to unrestrict link: ${response.statusText}`);
		}

		return response.json();
	}

	public async getUnrestrictedLink(
		id: string,
	): Promise<RealDebridUnrestrictFileFolder> {
		const response = await fetch(`${this.baseUrl}/unrestrict/link/${id}`, {
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
			},
		});

		if (!response.ok) {
			throw new Error(
				`Failed to get unrestricted link: ${response.statusText}`,
			);
		}

		return response.json();
	}
}
