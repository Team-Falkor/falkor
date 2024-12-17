import "@/@types/accounts/torbox";
import { TorBoxAPI } from "./models/api";
import {
  TorBoxAddTorrent,
  TorBoxAvailableTorrent,
  TorBoxDefaultInfo,
  TorBoxQueuedTorrent,
  TorBoxResponse,
  TorBoxTorrentInfoResult,
} from "@/@types/accounts/torbox";

export class Torrents extends TorBoxAPI {
  constructor(accessToken: string) {
    super(accessToken);
  }
  public async getHashInfo(
    hash: string
  ): Promise<TorBoxTorrentInfoResult | null> {
    const currentTorrents = await this.getCurrent();

    if (currentTorrents?.length) {
      const foundInCurrent = currentTorrents.find(
        (torrent) => torrent.hash.toLowerCase() === hash.toLowerCase()
      );
      if (foundInCurrent) return foundInCurrent;
    }

    const queuedTorrents = await this.getQueued();

    if (queuedTorrents?.length) {
      const foundInQueued = queuedTorrents.find(
        (torrent) => torrent.hash.toLowerCase() === hash.toLowerCase()
      );
      if (foundInQueued) return foundInQueued;
    }

    return null;
  }

  public async getCurrent(): Promise<TorBoxTorrentInfoResult[] | null> {
    const response = await this.makeRequest<
      TorBoxResponse<TorBoxTorrentInfoResult[]>
    >(`torrents/mylist?bypass_cache=true`, "GET", true);

    return response?.data || null;
  }

  public async getQueued(): Promise<TorBoxTorrentInfoResult[] | null> {
    const response = await this.makeRequest<
      TorBoxResponse<TorBoxQueuedTorrent[]>
    >("torrents/getqueued", "GET", true);

    if (!response || !response.data) {
      return null;
    }

    const torrents: TorBoxTorrentInfoResult[] = response.data.map(
      (torrent) => ({
        ...TorBoxDefaultInfo,
        id: torrent.id,
        authId: torrent.auth_id,
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
      })
    );

    return torrents;
  }

  public async getAllTorrents(): Promise<TorBoxTorrentInfoResult[]> {
    const torrents: TorBoxTorrentInfoResult[] = [];

    const currentTorrents = await this.getCurrent();
    if (currentTorrents?.length) {
      torrents.push(...currentTorrents);
    }

    const queuedTorrents = await this.getQueued();
    if (queuedTorrents?.length) {
      torrents.push(...queuedTorrents);
    }
    return torrents;
  }

  public async instantAvailability(
    torrentHash: string
  ): Promise<TorBoxAvailableTorrent | null> {
    const response = await this.makeRequest<
      TorBoxResponse<TorBoxAvailableTorrent[] | null>
    >(
      `torrents/checkcached?hash=${torrentHash}&format=list&list_files=true`,
      "GET",
      false
    );

    if (response.data && response.data.length > 0) {
      return response.data[0];
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
      body
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
      false
    );

    if (response.success && response.data) {
      return response.data;
    }

    return null;
  }

  public async delete(torrentHash: string): Promise<boolean> {
    const torrent = await this.getHashInfo(torrentHash);
    if (!torrent) {
      return false;
    }
    const body = new URLSearchParams({
      torrent_id: torrent.id.toString(),
      operation: "delete",
    });
    await this.makeRequest(
      `torrents/controltorrent`,
      "POST",
      true,
      body.toString()
    );
    return true;
  }
}
