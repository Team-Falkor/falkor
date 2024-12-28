import { DownloadgameData, DownloadStatus } from "../download";

export interface ITorrent {
  infoHash: string;
  name: string;
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  numPeers: number;
  path: string;
  paused: boolean;
  status: DownloadStatus;
  totalSize: number;
  timeRemaining: number;
  game_data?: DownloadgameData;
}
