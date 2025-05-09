import type { RealDebridTorrent, RealDebridTorrentInfo } from "@/@types";

export class RealDebridTorrentService {
	constructor(
		private readonly baseUrl: string,
		private readonly accessToken: string,
	) {}

	public async addTorrent(torrentFile: File | string): Promise<{ id: string }> {
		const formData = new FormData();
		if (typeof torrentFile === "string") {
			formData.append("magnet", torrentFile);
		} else {
			formData.append("torrent", torrentFile);
		}

		const response = await fetch(`${this.baseUrl}/torrents/addTorrent`, {
			method: "PUT",
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
			},
			body: formData,
		});

		if (!response.ok) {
			throw new Error(`Failed to add torrent: ${response.statusText}`);
		}

		return response.json();
	}

	public async getTorrents(): Promise<RealDebridTorrent[]> {
		const response = await fetch(`${this.baseUrl}/torrents`, {
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to get torrents: ${response.statusText}`);
		}

		return response.json();
	}

	public async getTorrentInfo(id: string): Promise<RealDebridTorrentInfo> {
		const response = await fetch(`${this.baseUrl}/torrents/info/${id}`, {
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to get torrent info: ${response.statusText}`);
		}

		return response.json();
	}

	public async deleteTorrent(id: string): Promise<void> {
		const response = await fetch(`${this.baseUrl}/torrents/delete/${id}`, {
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to delete torrent: ${response.statusText}`);
		}
	}

	public async selectFiles(id: string, fileIds: number[]): Promise<void> {
		const response = await fetch(`${this.baseUrl}/torrents/selectFiles/${id}`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: `files=${fileIds.join(",")}`,
		});

		if (!response.ok) {
			throw new Error(`Failed to select files: ${response.statusText}`);
		}
	}
}
