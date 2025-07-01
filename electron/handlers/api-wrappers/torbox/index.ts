import type { TorBoxTorrentInfoResult } from "@/@types/accounts";
import { getInfoHashFromMagnet } from "@backend/utils/utils";
import { Torrents } from "./services/torrents";
import { User } from "./services/user";
import { WebDownloads } from "./services/webDownloads";

class TorBoxClient {
	private static instance: TorBoxClient | null = null;
	private readonly apiKey: string;

	public readonly user: User;
	public readonly torrents: Torrents;
	public readonly webDownloads: WebDownloads;

	private constructor(apiKey: string) {
		if (!apiKey) {
			throw new Error(
				"Access token not provided. Please provide a valid access token.",
			);
		}
		this.apiKey = apiKey;
		this.user = new User(apiKey);
		this.torrents = new Torrents(apiKey);
		this.webDownloads = new WebDownloads(apiKey);
	}

	public static getInstance(apiKey: string): TorBoxClient {
		if (TorBoxClient.instance && TorBoxClient.instance.apiKey !== apiKey) {
			throw new Error(
				"A different instance with a conflicting access token already exists.",
			);
		}
		if (!TorBoxClient.instance) {
			TorBoxClient.instance = new TorBoxClient(apiKey);
		}
		return TorBoxClient.instance;
	}

	private async getOrCreateTorrent(
		magnetLink: string,
	): Promise<TorBoxTorrentInfoResult> {
		const infoHash = getInfoHashFromMagnet(magnetLink);

		if (!infoHash) {
			throw new Error("Invalid magnet provided.");
		}

		let foundTorrent = await this.torrents.getHashInfo(infoHash);
		if (foundTorrent) {
			return foundTorrent;
		}

		const addedTorrent = await this.torrents.addMagnet(magnetLink);
		if (!addedTorrent?.hash) {
			throw new Error("Failed to add torrent. No Hash returned.");
		}

		foundTorrent = await this.torrents.getHashInfo(infoHash);
		if (!foundTorrent) {
			throw new Error("Failed to retrieve added torrent info.");
		}
		return foundTorrent;
	}

	public async downloadTorrentFromMagnet(
		magnetLink: string,
	): Promise<TorBoxTorrentInfoResult> {
		const torrentInfo = await this.getOrCreateTorrent(
			decodeURIComponent(magnetLink),
		);

		return torrentInfo;
	}
}

export { TorBoxClient };
