import Fuse from "fuse.js";

interface ExtraData {
	genres?: string[];
	release_date?: string;
	platforms?: string[];
}
export type SearchingFor = "title" | "year" | "format";

type Matches<T> = T & { distance_from: number };

export class Mapping<T extends { name: string }> {
	// Games
	game_title: string;
	array_to_search: T[];

	// Settings
	match_percentage = 80;
	distance = 50;

	// Extra data
	extra_data?: ExtraData;

	matches: Set<Matches<T>> = new Set();

	constructor(
		game_title: string,
		array_to_search: T[],
		extra_data?: ExtraData,
	) {
		this.game_title = game_title;
		this.array_to_search = array_to_search;
		this.extra_data = extra_data;
	}

	async search(searching_for: SearchingFor = "title") {
		switch (searching_for) {
			default: {
				const fuse = new Fuse(this.array_to_search, {
					keys: ["title", "name", "game_name"],
					distance: this.distance,
					threshold: this.match_percentage / 100,
				});

				const result = fuse.search(this.game_title);

				return result[0].item;
			}
		}
	}

	async compare() {
		const match = await this.search();

		return match;
	}
}
