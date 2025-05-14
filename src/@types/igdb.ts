export type IGDBImageSize =
	| "original"
	| "cover_small"
	| "screenshot_med"
	| "cover_big"
	| "cover_med"
	| "logo_med"
	| "screenshot_big"
	| "screenshot_huge"
	| "thumb"
	| "micro"
	| "720p"
	| "1080p";

export interface IGDBReturnDataType {
	id: number;
	age_ratings?: number[];
	alternative_names?: number[];
	artworks?: number[];
	category: number;
	collection?: number;
	cover: IGDBReturnDataTypeCover;
	created_at: number;
	external_games?: number[];
	first_release_date: number;
	follows?: number;
	game_engines?: GameEngine[];
	game_modes: number[];
	genres: Genre[];
	hypes: number;
	involved_companies: InvolvedCompany[];
	keywords?: number[];
	multiplayer_modes?: number[];
	name: string;
	parent_game?: number;
	platforms: Platform[];
	player_perspectives: number[];
	rating: number;
	rating_count: number;
	release_dates: ReleaseDate[];
	screenshots?: IGDBReturnDataTypeCover[];
	similar_games: SimilarGame[];
	slug: string;
	storyline?: string;
	summary: string;
	tags: number[];
	themes: number[];
	total_rating: number;
	total_rating_count: number;
	updated_at: number;
	url: string;
	videos?: Video[];
	websites: Website[];
	checksum: string;
	language_supports?: number[];
	game_localizations?: number[];
	collections?: number[];
	aggregated_rating?: number;
	aggregated_rating_count?: number;
	bundles?: number[];
	expansions?: number[];
	franchises?: number[];
	standalone_expansions?: number[];
	dlcs?: number[];
	expanded_games?: number[];
}

export interface IGDBReturnDataTypeCover {
	id: number;
	alpha_channel?: boolean;
	animated?: boolean;
	game: number;
	height: number;
	image_id: string;
	url: string;
	width: number;
	checksum: string;
}

export interface GameEngine {
	id: number;
	created_at: number;
	name: string;
	slug: string;
	updated_at: number;
	url: string;
	checksum: string;
	companies?: number[];
	logo?: number;
	platforms?: number[];
}

export interface Genre {
	id: number;
	created_at: number;
	name: string;
	slug: string;
	updated_at: number;
	url: string;
	checksum: string;
}

export interface InvolvedCompany {
	id: number;
	company: Company;
	created_at: number;
	developer: boolean;
	game: number;
	porting: boolean;
	publisher: boolean;
	supporting: boolean;
	updated_at: number;
	checksum: string;
}

type Company = {
	id: number;
	change_date_category: number;
	country: number;
	created_at: number;
	description: string;
	logo: number;
	name: string;
	parent: number;
	published: number[];
	slug: string;
	start_date: number;
	start_date_category: number;
	updated_at: number;
	url: string;
	websites: number[];
	checksum: string;
};

export interface Platform {
	id: number;
	abbreviation: string;
	alternative_name?: string;
	category: number;
	created_at: number;
	name: string;
	platform_logo: number;
	slug: string;
	updated_at: number;
	url: string;
	versions: number[];
	websites?: number[];
	checksum: string;
	generation?: number;
	platform_family?: number;
	summary?: string;
}

export interface ReleaseDate {
	id: number;
	category: number;
	created_at: number;
	date?: number;
	game: number;
	human: string;
	m?: number;
	platform: number;
	region: number;
	updated_at: number;
	y?: number;
	checksum: string;
	status?: number;
}

export interface SimilarGame {
	id: number;
	age_ratings?: number[];
	aggregated_rating?: number;
	aggregated_rating_count?: number;
	artworks?: number[];
	category: number;
	cover: IGDBReturnDataTypeCover;
	created_at: number;
	external_games: number[];
	first_release_date?: number;
	follows?: number;
	game_modes?: number[];
	genres: Array<Genre>;
	involved_companies?: Array<GameEngineClass | number>;
	keywords?: number[];
	multiplayer_modes?: number[];
	name: string;
	platforms: Platform[];
	player_perspectives?: number[];
	rating?: number;
	rating_count?: number;
	release_dates: ReleaseDate[];
	screenshots?: IGDBReturnDataTypeCover[];
	similar_games: Array<GameEngineClass | number>;
	slug: string;
	storyline?: string;
	summary: string;
	tags: number[];
	themes: number[];
	total_rating?: number;
	total_rating_count?: number;
	updated_at: number;
	url: string;
	videos?: Array<GameEngineClass | number>;
	websites: Array<GameEngineClass | number>;
	checksum: string;
	language_supports?: number[];
	alternative_names?: number[];
	bundles?: number[];
	dlcs?: number[];
	expansions?: number[];
	franchises?: number[];
	game_engines?: Array<GameEngineClass | number>;
	hypes?: number;
	game_localizations?: number[];
	collections?: number[];
	collection?: number;
	status?: number;
	expanded_games?: number[];
	standalone_expansions?: number[];
	remasters?: number[];
	ports?: number[];
	franchise?: number;
	remakes?: number[];
}

export interface GameEngineClass {
	id: number;
}

export interface Video {
	id: number;
	game: number;
	name: string;
	video_id: string;
	checksum: string;
}

export interface Website {
	id: number;
	category: number;
	game: number;
	trusted: boolean;
	url: string;
	checksum: string;
}

export interface IGDBAccessTokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token: string;
}

export type SteamStoreData = {
	type: string;
	name: string;
	steam_appid: number;
	required_age: number;
	is_free: boolean;
	controller_support: string;
	dlc: number[];
	detailed_description: string;
	about_the_game: string;
	short_description: string;
	supported_languages: string;
	header_image: string;
	capsule_image: string;
	capsule_imagev5: string;
	website: string;
	pc_requirements: PcRequirements;
	mac_requirements: PcRequirements;
	linux_requirements: PcRequirements;
	developers: string[];
	publishers: string[];
	demos: { appid: number; description: string }[];
	price_overview: {
		currency: string;
		initial: number;
		final: number;
		discount_percent: number;
		initial_formatted: string;
		final_formatted: string;
	};
	packages: number[];
	package_groups: {
		name: string;
		title: string;
		description: string;
		selection_text: string;
		save_text: string;
		display_type: number;
		is_recurring_subscription: string;
		subs: {
			packageid: number;
			percent_savings_text: string;
			percent_savings: number;
			option_text: string;
			option_description: string;
			can_get_free_license: string;
			is_free_license: boolean;
			price_in_cents_with_discount: number;
		}[];
	}[];
	platforms: {
		windows: boolean;
		mac: boolean;
		linux: boolean;
	};
	metacritic: {
		score: number;
		url: string;
	};
	categories: { id: number; description: string }[];
	genres: { id: string; description: string }[];
	screenshots: {
		id: number;
		path_thumbnail: string;
		path_full: string;
	}[];
	movies: {
		id: number;
		name: string;
		thumbnail: string;
		webm: {
			480: string;
			max: string;
		};
		mp4: {
			480: string;
			max: string;
		};
		highlight: boolean;
	}[];
	recommendations: {
		total: number;
	};
	achievements: {
		total: number;
		highlighted: {
			name: string;
			path: string;
		}[];
	};
	release_date: {
		coming_soon: boolean;
		date: string;
	};
	support_info: {
		url: string;
		email: string;
	};
	background: string;
	background_raw: string;
	content_descriptors: {
		ids: number[];
		notes: string | null;
	};
	ratings: {
		usk: {
			rating: string;
		};
		agcom: {
			rating: string;
			descriptors: string;
		};
	};
};

export interface PcRequirements {
	minimum?: string;
	recommended?: string;
}

export type SteamApiResponse = {
	[appid: string]: {
		success: boolean;
		data: SteamStoreData;
	};
};

export interface InfoReturn extends IGDBReturnDataType {
	steam?: SteamApiResponse[0] | null;
}
