export interface RealDebridUser {
	id: number;
	username: string;
	email: string;
	points: number;
	locale: string;
	avatar: string;
	type: "premium" | "free";
	premium: number;
	expiration: string;
}

export interface RealDebridTrafficDetails {
	left: number;
	bytes: number;
	links: number;
	limit: number;
	type: "links" | "gigabytes" | "bytes";
	extra: number;
	reset: "daily" | "weekly" | "monthly";
}

export interface RealDebridDownloadHistoryItem {
	id: string;
	filename: string;
	mimeType: string;
	filesize: number;
	link: string;
	host: string;
	chunks: number;
	download: string;
	generated: string;
	type?: string;
}

export interface RealDebridUnrestrictCheck {
	host: string;
	link: string;
	filename: string;
	filesize: number;
	supported: number;
}

export interface RealDebridUnrestrictFileFolder {
	id: string;
	filename: string;
	mimeType: string;
	filesize: number;
	link: string;
	host: string;
	chunks: number;
	crc: number;
	download: string;
	streamable: number;
	type?: string;
	alternative?: Array<{
		id: string;
		filename: string;
		download: string;
		type: string;
	}>;
}

export interface RealDebridTorrentFile {
	id: number;
	path: string;
	bytes: number;
	selected: number;
}

export interface RealDebridTorrent {
	id: string;
	filename: string;
	hash: string;
	bytes: number;
	host: string;
	split: number;
	progress: number;
	status:
		| "magnet_error"
		| "magnet_conversion"
		| "waiting_files_selection"
		| "queued"
		| "downloading"
		| "downloaded"
		| "error"
		| "virus"
		| "compressing"
		| "uploading"
		| "dead";
	added: string;
	links: string[];
	ended?: string;
	speed?: number;
	seeders?: number;
}

export interface RealDebridTorrentInfo extends RealDebridTorrent {
	original_filename: string;
	original_bytes: number;
	files: RealDebridTorrentFile[];
}
