import type { RealDebridTorrent, RealDebridTorrentInfo } from "@/@types";

export class RealDebridTorrentService {
	constructor(
		private readonly baseUrl: string,
		private readonly accessToken: string,
	) {}

	private get authHeaders() {
		return {
			Authorization: `Bearer ${this.accessToken}`,
		};
	}

	public async addTorrent(file: File): Promise<{ id: string }> {
		const formData = new FormData();
		formData.append("torrent", file);

		const response = await fetch(`${this.baseUrl}/torrents/addTorrent`, {
			method: "PUT",
			headers: this.authHeaders,
			body: formData,
		});

		if (!response.ok) {
			throw new Error(`Failed to add torrent: ${response.statusText}`);
		}

		return response.json();
	}

	public async addMagnet(
		magnetUri: string,
	): Promise<{ id: string; uri: string }> {
		const formData = new URLSearchParams();
		formData.append("magnet", magnetUri);

		const response = await fetch(`${this.baseUrl}/torrents/addMagnet`, {
			method: "POST",
			headers: {
				...this.authHeaders,
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: formData.toString(),
		});

		if (!response.ok) {
			throw new Error(`Failed to add magnet: ${response.statusText}`);
		}

		return response.json();
	}

	public async addTorrentOrMagnet(
		input: File | string,
	): Promise<{ id: string; uri?: string }> {
		if (typeof input === "string") {
			return this.addMagnet(input);
		}

		return this.addTorrent(input);
	}

	public async getTorrents(): Promise<RealDebridTorrent[]> {
		const response = await fetch(`${this.baseUrl}/torrents`, {
			headers: this.authHeaders,
		});

		if (!response.ok) {
			throw new Error(`Failed to get torrents: ${response.statusText}`);
		}

		return response.json();
	}

	public async getTorrentInfo(id: string): Promise<RealDebridTorrentInfo> {
		const response = await fetch(`${this.baseUrl}/torrents/info/${id}`, {
			headers: this.authHeaders,
		});

		if (!response.ok) {
			throw new Error(`Failed to get torrent info: ${response.statusText}`);
		}

		return response.json();
	}

	public async deleteTorrent(id: string): Promise<void> {
		const response = await fetch(`${this.baseUrl}/torrents/delete/${id}`, {
			method: "DELETE",
			headers: this.authHeaders,
		});

		if (!response.ok) {
			throw new Error(`Failed to delete torrent: ${response.statusText}`);
		}
	}

	public async selectFiles(id: string, fileIds: number[]): Promise<void> {
		const response = await fetch(`${this.baseUrl}/torrents/selectFiles/${id}`, {
			method: "POST",
			headers: {
				...this.authHeaders,
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: `files=${fileIds.join(",")}`,
		});

		if (!response.ok) {
			throw new Error(`Failed to select files: ${response.statusText}`);
		}
	}

	public async selectAllFiles(id: string): Promise<void> {
		const torrentInfo = await this.getTorrentInfo(id);
		const fileIds = torrentInfo.files.map((file) => file.id);
		await this.selectFiles(id, fileIds);
		return;
	}
}
