import "@/@types/accounts/torbox";
import { TorBoxAPI } from "./api";
import {
	type TorBoxAddTorrent,
	type TorBoxAvailableTorrent,
	TorBoxDefaultInfo,
	type TorBoxQueuedDownload,
	type TorBoxResponse,
	type TorBoxTorrentInfoResult,
} from "@/@types/accounts/torbox";

export class Torrents extends TorBoxAPI {
	public async getHashInfo(
		hash: string,
	): Promise<TorBoxTorrentInfoResult | null> {
		const currentTorrents = await this.getCurrent();

		if (currentTorrents?.length) {
			const foundInCurrent = currentTorrents.find(
				(torrent) => torrent.hash.toLowerCase() === hash.toLowerCase(),
			);
			if (foundInCurrent) return foundInCurrent;
		}

		const queuedTorrents = await this.getQueued();

		if (queuedTorrents?.length) {
			const foundInQueued = queuedTorrents.find(
				(torrent) => torrent.hash.toLowerCase() === hash.toLowerCase(),
			);
			if (foundInQueued) return foundInQueued;
		}

		return null;
	}

	public async getCurrent(): Promise<TorBoxTorrentInfoResult[] | null> {
		const response = await this.makeRequest<
			TorBoxResponse<TorBoxTorrentInfoResult[]>
		>("torrents/mylist?bypass_cache=true", "GET", true);

		return response?.data || null;
	}

	public async getQueued(): Promise<TorBoxTorrentInfoResult[] | null> {
		const response = await this.makeRequest<
			TorBoxResponse<TorBoxQueuedDownload[]>
		>("queued/getqueued?type=torrent", "GET", true);

		if (!response || !response.data) {
			return null;
		}

		const torrents: TorBoxTorrentInfoResult[] = response.data.map(
			(torrent) => ({
				...TorBoxDefaultInfo,
				id: torrent.id,
				hash: torrent.hash,
				name: torrent.name,
				magnet: torrent.magnet,
				createdAt: torrent.created_at,
				downloadState: "queued",
				torrentFile: !!torrent.torrent_file,
				progress: 0.0,
				files: [],
				downloadSpeed: 0,
				seeds: 0,
				updatedAt: torrent.created_at,
			}),
		);

		return torrents;
	}

	public async instantAvailability(
		torrentHashes: string[],
	): Promise<TorBoxAvailableTorrent[] | null> {
		const hashParams = torrentHashes.map((h) => `hash=${h}`).join("&");
		const url = `torrents/checkcached?format=list&list_files=false&${hashParams}`;
		const response = await this.makeRequest<
			TorBoxResponse<TorBoxAvailableTorrent[] | null>
		>(url, "GET", true);

		if (response.data && response.data.length > 0) {
			return response.data;
		}

		return null;
	}

	public async addMagnet(magnet: string): Promise<TorBoxAddTorrent | null> {
		const body = new FormData();
		body.append("magnet", magnet);
		body.append("seed", "3");
		body.append("zip", "false");

		const response = await this.makeRequest<TorBoxResponse<TorBoxAddTorrent>>(
			"torrents/createtorrent",
			"POST",
			true,
			body,
		);

		if (response.data) {
			return response.data;
		}
		return null;
	}

	public async getZipDL(torrentId: string): Promise<string | null> {
		const response = await this.makeRequest<TorBoxResponse<string | null>>(
			`torrents/requestdl?token=${this.accessToken}&torrent_id=${torrentId}&zip_link=true`,
			"GET",
			false,
		);

		if (response.success && response.data) {
			return response.data;
		}

		return null;
	}
}

let instance: Torrents | null = null;

export const getTorBoxTorrentsInstance = (api_key: string): Torrents => {
	if (!instance) {
		instance = new Torrents(api_key);
	}
	return instance;
};
