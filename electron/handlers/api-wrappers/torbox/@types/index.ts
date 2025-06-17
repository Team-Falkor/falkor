export interface TorBoxTorrentInfoResult {
	id: number;
	auth_id: string;
	server: number;
	hash: string;
	name: string;
	magnet: string;
	size: number;
	active: boolean;
	created_at: Date;
	updated_at: Date;
	download_state: string;
	seeds: number;
	peers: number;
	ratio: number;
	progress: number;
	download_speed: number;
	upload_speed: number;
	eta: number;
	torrent_file: boolean;
	expires_at?: string;
	download_present: boolean;
	files: TorBoxTorrentInfoResultFile[];
	download_path: string;
	availability: number;
	download_finished: boolean;
	tracker?: string | null;
	total_uploaded: number;
	total_downloaded: number;
	cached: boolean;
	owner: string;
	seed_torrent: boolean;
	allow_zipped: boolean;
	long_term_seeding: boolean;
	tracker_message?: string;
	cached_at?: Date;
}

export interface TorBoxTorrentInfoResultFile {
	id: number;
	md5?: string;
	hash: string;
	name: string;
	size: number;
	s3_path: string;
	infected: boolean;
	mimetype: string;
	short_name: string;
	absolute_path: string;
}

export interface TorBoxUser {
	id: number;
	auth_id: string;
	created_at: string;
	updated_at: string;
	plan: number;
	total_downloaded: number;
	customer: string;
	is_subscribed: boolean;
	premium_expires_at: string;
	cooldown_until: string;
	email: string;
	user_referral: string;
	base_email: string;
	total_bytes_downloaded: number;
	total_bytes_uploaded: number;
	torrents_downloaded: number;
	web_downloads_downloaded: number;
	usenet_downloads_downloaded: number;
	additional_concurrent_slots: number;
	long_term_seeding: boolean;
	long_term_storage: boolean;
	is_vendor: boolean;
	vendor_id?: string;
	purchases_referred: number;
}

export interface TorBoxSimpleResponse {
	success: boolean;
	error?: string;
	detail?: string;
}

export interface TorBoxResponse<T> extends TorBoxSimpleResponse {
	data?: T;
}

export interface TorBoxQueuedDownload {
	id: number;
	created_at: Date;
	magnet: string;
	torrent_file?: string | null;
	hash: string;
	name: string;
	type: string;
}

export const TorBoxDefaultInfo: TorBoxTorrentInfoResult = {
	id: 0,
	auth_id: "",
	hash: "",
	name: "",
	magnet: "",
	server: 0,
	size: 0,
	active: false,
	created_at: new Date(),
	updated_at: new Date(),
	download_state: "",
	seeds: 0,
	peers: 0,
	ratio: 0,
	progress: 0,
	download_speed: 0,
	upload_speed: 0,
	eta: 0,
	torrent_file: false,
	expires_at: undefined,
	download_present: false,
	files: [],
	download_path: "",
	availability: 0,
	download_finished: false,
	tracker: undefined,
	total_uploaded: 0,
	total_downloaded: 0,
	cached: false,
	owner: "",
	seed_torrent: false,
	allow_zipped: false,
	long_term_seeding: false,
	tracker_message: undefined,
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

export interface TorBoxAddTorrent {
	hash?: string;
	torrent_id?: number;
	auth_id?: string;
}
