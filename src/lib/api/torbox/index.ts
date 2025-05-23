import { getInfoHashFromMagnet } from "@/lib/utils";
import { Torrents } from "./torrents";
import { User } from "./user";
import { toast } from "sonner";
import { TorBoxTorrentInfoResult } from "@/@types/accounts";

class TorBoxClient {
  private static instance: TorBoxClient | null = null;
  private readonly apiKey: string;

  public readonly user: User;
  public readonly torrents: Torrents;

  private constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error(
        "Access token not provided. Please provide a valid access token."
      );
    }
    this.apiKey = apiKey;
    this.user = new User(apiKey);
    this.torrents = new Torrents(apiKey);
  }

  public static getInstance(apiKey: string): TorBoxClient {
    if (TorBoxClient.instance && TorBoxClient.instance.apiKey !== apiKey) {
      throw new Error(
        "A different instance with a conflicting access token already exists."
      );
    }
    if (!TorBoxClient.instance) {
      TorBoxClient.instance = new TorBoxClient(apiKey);
    }
    return TorBoxClient.instance;
  }

  private async getOrCreateTorrent(
    magnetLink: string
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
    return foundTorrent!;
  }

  public async downloadTorrentFromMagnet(magnetLink: string): Promise<string> {
    const torrentInfo = await this.getOrCreateTorrent(
      decodeURIComponent(magnetLink)
    );

    if (!torrentInfo || !torrentInfo.download_present) {
      toast.warning(
        "Download has not been cached yet. Please try again later."
      );
      throw new Error("Torrent has not completed downloading.");
    }

    const downloadLink = await this.torrents.getZipDL(
      torrentInfo.id.toString()
    );

    if (downloadLink) {
      return downloadLink;
    }
    throw Error("Could not obtain download link.");
  }

  public async downloadFromFileHost(
    _url: string,
    _password?: string
  ): Promise<string> {
    throw new Error("TorBox currently does not support file host downloads.");
  }
  public async getDownloadName(url: string, type: string): Promise<string> {
    if (type != "ddl") {
      const torrentHash = getInfoHashFromMagnet(url);
      if (torrentHash) {
        const torrentInfo = await this.torrents.getHashInfo(torrentHash);

        if (torrentInfo) {
          return `${torrentInfo.name}`;
        }
      }
    }
    return "";
  }
}

export default TorBoxClient;
