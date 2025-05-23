import { getInfoHashFromMagnet } from "@backend/utils/utils";
import type { RealDebridDownloadItem } from "@/@types";
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
		// Re-initialize if instance doesn't exist or if access token has changed
		if (
			!RealDebridClient.instance ||
			RealDebridClient.instance.accessToken !== accessToken
		) {
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

	private async getOrCreateTorrent(magnetLink: string): Promise<string> {
		const infoHash = getInfoHashFromMagnet(magnetLink);
		const existingTorrents = await this.torrents.getTorrents();
		const foundTorrent = existingTorrents?.length
			? existingTorrents?.find((torrent) => torrent.hash === infoHash)
			: null;

		if (foundTorrent) {
			return foundTorrent.id;
		}

		// If torrent does not exist, add it and return the new ID
		const addedTorrent = await this.torrents.addTorrentOrMagnet(magnetLink);
		if (!addedTorrent?.id) {
			throw new Error("Failed to add torrent. No ID returned.");
		}
		return addedTorrent.id;
	}

	public async downloadTorrentFromMagnet(
		magnetLink: string,
		_password?: string,
		_fileSelection: string | "all" = "all",
	): Promise<RealDebridDownloadItem> {
		const torrentId = await this.getOrCreateTorrent(
			decodeURIComponent(magnetLink),
		);
		let torrentInfo = await this.torrents.getTorrentInfo(torrentId);

		// Select files if necessary
		if (torrentInfo.status === "waiting_files_selection") {
			await this.torrents.selectAllFiles(torrentId);
			torrentInfo = await this.torrents.getTorrentInfo(torrentId);
		}

		// Check download status
		if (torrentInfo.status !== "downloaded") {
			return {
				status: "downloading",
				filename: torrentInfo.filename,
				download: null,
				size: null,
			};

			// For now just throw an error
			// throw new Error("Torrent has not completed downloading.");
		}

		// Ensure links are available
		const [firstLink] = torrentInfo.links || [];
		if (!firstLink) {
			throw new Error("No links available for the completed torrent.");
		}

		// Unrestrict the first available link
		try {
			const unrestrictedLink = await this.unrestrict.unrestrictLink(firstLink);
			return {
				download: unrestrictedLink.download,
				filename: unrestrictedLink.filename,
				size: unrestrictedLink.filesize,
				status: torrentInfo.status,
			};
		} catch (error) {
			throw new Error(`Failed to unrestrict link: ${(error as Error).message}`);
		}
	}
}

export { RealDebridAuthService, RealDebridClient };
