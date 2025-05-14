export interface ITADGameSearch {
	id: string;
	slug: string;
	title: string;
	type: "game" | "dlc";
	mature: boolean;
}

export type ITADGameLookup =
	| {
			found: true;
			game: {
				id: string;
				slug: string;
				title: string;
				type: string | null;
				mature: boolean;
			};
	  }
	| {
			found: false;
			game: null;
	  };

export interface ITADPrice {
	id: string;
	deals: Deal[];
}

export interface Deal {
	shop: Shop;
	price: HistoryLow;
	regular: HistoryLow;
	cut: number;
	voucher: null;
	storeLow: HistoryLow;
	historyLow: HistoryLow;
	flag: string;
	drm: Shop[];
	platforms: Shop[];
	timestamp: Date;
	expiry: Date | null;
	url: string;
}

export interface Shop {
	id: number;
	name: string;
}

export interface HistoryLow {
	amount: number;
	amountInt: number;
	currency: string;
}

export interface ITADGameInfo {
	id: string;
	slug: string;
	title: string;
	type: string;
	mature: boolean;
	assets: Assets;
	earlyAccess: boolean;
	achievements: boolean;
	tradingCards: boolean;
	appid: number;
	tags: string[];
	releaseDate: Date;
	developers: Developer[];
	publishers: Developer[];
	reviews: Review[];
	stats: Stats;
	players: Players;
	urls: Urls;
}

export interface Assets {
	boxart: string;
	banner145: string;
	banner300: string;
	banner400: string;
	banner600: string;
}

export interface Developer {
	id: number;
	name: string;
}

export interface Players {
	recent: number;
	day: number;
	week: number;
	peak: number;
}

export interface Review {
	score: number;
	source: string;
	count: number;
	url: string;
}

export interface Stats {
	rank: number;
	waitlisted: number;
	collected: number;
}

export interface Urls {
	game: string;
}
