export interface RealDebridUser {
	id: number;
	username: string;
	email: string;
	points: number;
	locale: string;
	avatar: string;
	type: string;
	premium: number;
	expiration: string;
}

export interface RealDebridDeviceCode {
	device_code: string;
	user_code: string;
	interval: number;
	expires_in: number;
	verification_url: string;
}

export interface RealDebridToken {
	access_token: string;
	expires_in: number;
	refresh_token: string;
	token_type: string;
}

export interface RealDebridTorrent {
	id: string;
	filename: string;
	hash: string;
	bytes: number;
	host: string;
	split: number;
	progress: number;
	status: string;
	added: string;
	links: string[];
}

export interface RealDebridTorrentInfo extends RealDebridTorrent {
	original_bytes: number;
	original_filename: string;
	files: Array<{
		id: number;
		path: string;
		bytes: number;
		selected: number;
	}>;
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
}
