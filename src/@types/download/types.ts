export interface DownloadData {
  id: string;
  url: string;
  filename: string;
  game_data: DownloadgameData;
  path?: string;
  downloadSpeed: number;
  progress: number;
  totalSize?: number;
  status: DownloadStatus;
  timeRemaining?: number | "completed";
}

export type DownloadStatus =
  | "pending"
  | "downloading"
  | "completed"
  | "error"
  | "paused"
  | "stopped";

export interface AddDownloadData {
  id: string;
  url: string;
  file_path?: string;
  file_extension?: string;
  file_name: string;
  game_data: DownloadgameData;
}

export type DownloadgameData = {
  id: number;
  name: string;
  image_id: string;
  banner_id?: string;
};

export type QueueDataTorrent = {
  type: "torrent";
  data: {
    torrentId: string;
    game_data: DownloadgameData;
  };
};

export type QueueDataDownload = {
  type: "download";
  data: AddDownloadData;
};

export type QueueData = QueueDataTorrent | QueueDataDownload;
