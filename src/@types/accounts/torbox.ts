export type TorBoxStatus =
  | "queued"
  | "metaDL"
  | "checking"
  | "checkingResumeData"
  | "paused"
  | "stalledDL"
  | "downloading"
  | "completed"
  | "uploading"
  | "uploading (no peers)"
  | "stalled"
  | "stalled (no seeds)"
  | "processing"
  | "cached"
  | "error";

export interface TorBoxTorrentInfoResult {
  id: number;
  authId: string;
  server: number;
  hash: string;
  name: string;
  magnet: string;
  size: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  downloadState: string;
  seeds: number;
  peers: number;
  ratio: number;
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  eta: number;
  torrentFile: boolean;
  expiresAt?: string;
  downloadPresent: boolean;
  files: TorBoxTorrentInfoResultFile[];
  downloadPath: string;
  inactiveCheck: number;
  availability: number;
  downloadFinished: boolean;
  tracker?: string | null;
  totalUploaded: number;
  totalDownloaded: number;
  cached: boolean;
  owner: string;
  seedTorrent: boolean;
  allowZipped: boolean;
  longTermSeeding: boolean;
  trackerMessage?: string;
}

export interface TorBoxTorrentInfoResultFile {
  id: number;
  md5: string;
  hash: string;
  name: string;
  size: number;
  s3Path: string;
  mimeType: string;
  shortName: string;
  absolutePath: string;
}

export interface TorBoxUser {
  id?: number;
  authId?: string;
  createdAt?: string;
  updatedAt?: string;
  plan?: number;
  totalDownloaded?: number;
  customer?: string;
  isSubscribed?: boolean;
  premiumExpiresAt?: string;
  cooldownUntil?: string;
  email?: string;
  userReferral?: string;
  baseEmail?: string;
  totalBytesDownloaded?: number;
  totalBytesUploaded?: number;
  torrentsDownloaded?: number;
  webDownloadsDownloaded?: number;
  usenetDownloadsDownloaded?: number;
  additionalConcurrentSlots?: number;
  longTermSeeding?: boolean;
  longTermStorage?: boolean;
}

export interface TorBoxSimpleResponse {
  success?: boolean;
  error?: string;
  detail?: string;
}

export interface TorBoxResponse<T> extends TorBoxSimpleResponse {
  data?: T;
}

export interface TorBoxQueuedTorrent {
  id: number;
  authId: string;
  createdAt: Date;
  magnet: string;
  torrentFile?: string | null;
  hash: string;
  name: string;
  type: string;
}

export const TorBoxDefaultInfo: TorBoxTorrentInfoResult = {
  id: 0,
  authId: "",
  hash: "",
  name: "",
  magnet: "",
  server: 0,
  size: 0,
  active: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  downloadState: "",
  seeds: 0,
  peers: 0,
  ratio: 0,
  progress: 0,
  downloadSpeed: 0,
  uploadSpeed: 0,
  eta: 0,
  torrentFile: false,
  expiresAt: undefined,
  downloadPresent: false,
  files: [],
  downloadPath: "",
  inactiveCheck: 0,
  availability: 0,
  downloadFinished: false,
  tracker: undefined,
  totalUploaded: 0,
  totalDownloaded: 0,
  cached: false,
  owner: "",
  seedTorrent: false,
  allowZipped: false,
  longTermSeeding: false,
  trackerMessage: undefined,
};

export interface TorBoxAvailableTorrent {
  name: string;
  size: number;
  hash: string;
  files?: TorBoxAvailableTorrentFile[];
}

export interface TorBoxAvailableTorrentFile {
  name: string;
  size: number;
}

export interface User {
  id?: number;
  authId?: string;
  createdAt?: string;
  updatedAt?: string;
  plan?: number;
  totalDownloaded?: number;
  customer?: string;
  isSubscribed?: boolean;
  premiumExpiresAt?: string;
  cooldownUntil?: string;
  email?: string;
  userReferral?: string; // UUID
  baseEmail?: string;
  totalBytesDownloaded?: number;
  totalBytesUploaded?: number;
  torrentsDownloaded?: number;
  webDownloadsDownloaded?: number;
  usenetDownloadsDownloaded?: number;
  additionalConcurrentSlots?: number;
  longTermSeeding?: boolean;
  longTermStorage?: boolean;
}
