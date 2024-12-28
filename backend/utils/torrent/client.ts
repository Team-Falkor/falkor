import { DownloadgameData } from "@/@types";
import WebTorrent, { Torrent } from "webtorrent";
import { logger } from "../../handlers/logging";

export const client = new WebTorrent();

export type TorrentWithGameData = Torrent & { game_data: DownloadgameData };

export const combineTorrentData = (
  torrent: Torrent,
  game_data: DownloadgameData
) => {
  return { ...torrent, game_data } as TorrentWithGameData;
};

client.on("error", (error) => {
  console.error("WebTorrent error:", error);
  logger.log("error", `[torrent] error: ${(error as Error).message}`);
});

export const torrents: Map<string, TorrentWithGameData> = new Map();
