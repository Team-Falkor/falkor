import { getInfoHashFromMagnet } from "@/lib/utils";
import { toast } from "sonner";
import { Torrents } from "./torrents";
import { Unrestrict } from "./unrestrict";
import { User } from "./user";

class TorBoxClient {
  private static instance: TorBoxClient | null = null;
  private readonly apiKey: string;

  public readonly unrestrict: Unrestrict;
  public readonly user: User;
  public readonly torrents: Torrents;

  private constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error(
        "Access token not provided. Please provide a valid access token."
      );
    }
    this.apiKey = apiKey;
    this.unrestrict = new Unrestrict(apiKey);
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

  private async getOrCreateTorrent(magnetLink: string): Promise<string> {
    const infoHash = getInfoHashFromMagnet(magnetLink);
    const existingTorrents = await this.torrents.getAllTorrents();
    const foundTorrent = existingTorrents?.length
      ? existingTorrents?.find((torrent) => torrent.hash === infoHash)
      : null;

    if (foundTorrent) {
      return foundTorrent.hash.toString();
    }

    // If torrent does not exist, add it and return the new ID
    const addedTorrent = await this.torrents.addMagnet(magnetLink);
    console.log(addedTorrent);
    if (!addedTorrent?.id) {
      throw new Error("Failed to add torrent. No ID returned.");
    }
    return addedTorrent.id;
  }

  public async downloadTorrentFromMagnet(magnetLink: string): Promise<string> {
    const torrentHash = await this.getOrCreateTorrent(
      decodeURIComponent(magnetLink)
    );
    const torrentInfo = await this.torrents.getHashInfo(torrentHash);

    // Check download status
    if (!torrentInfo || !torrentInfo.downloadPresent) {
      throw new Error("Torrent has not completed downloading.");
    }

    const torrentRestrictedLinks: string[] = [];

    torrentInfo.files.forEach(function (file) {
      torrentRestrictedLinks.push(
        `https://torbox.app/fakedl/${torrentInfo.id}/${file.id}`
      );
    });
    return torrentRestrictedLinks[0];
  }

  public async downloadFromFileHost(
    url: string,
    password?: string
  ): Promise<string> {
    try {
      const unrestrictedLink = await this.unrestrict.link(url, password);
      return unrestrictedLink.download;
    } catch (error) {
      toast.error(`Failed to unrestrict link`, {
        description: (error as Error).message,
      });
      throw new Error(`Failed to unrestrict link: ${(error as Error).message}`);
    }
  }
}

export default TorBoxClient;
