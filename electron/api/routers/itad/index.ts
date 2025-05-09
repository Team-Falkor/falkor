import { publicProcedure, router } from "@backend/api/trpc";
import { ITAD } from "@backend/handlers/api-wrappers/itad";
import { Mapping } from "@backend/utils/mapping";
import { getUserCountry } from "@backend/utils/utils";
import { z } from "zod";

// Input schemas
const gameSearchInput = z.object({
	query: z.string().min(1),
});

const gameLookupInput = z.object({
	id: z.union([z.string().min(1), z.number()]),
});

const gameInfoInput = z.object({
	id: z.string().min(1),
});

const gamePricesInput = z.object({
	ids: z.array(z.string().min(1)).min(1),
	country: z.string().optional(),
});

const gamePricesByNameInput = z.object({
	name: z.string().min(1),
	country: z.string().optional(),
});

export const itadRouter = router({
	/**
	 * Search for games on IsThereAnyDeal.
	 */
	search: publicProcedure.input(gameSearchInput).query(async ({ input }) => {
		const itad = ITAD.getInstance();
		return await itad.gameSearch(input.query);
	}),

	/**
	 * Lookup a game by title or Steam AppID.
	 */
	lookup: publicProcedure.input(gameLookupInput).query(async ({ input }) => {
		const itad = ITAD.getInstance();
		return await itad.gameLookup(input.id);
	}),

	/**
	 * Get detailed information about a game using its ITAD plain ID.
	 */
	info: publicProcedure.input(gameInfoInput).query(async ({ input }) => {
		const itad = ITAD.getInstance();
		return await itad.gameInfo(input.id);
	}),

	/**
	 * Get current prices for one or more games using their ITAD plain IDs.
	 */
	prices: publicProcedure.input(gamePricesInput).query(async ({ input }) => {
		const itad = ITAD.getInstance();
		return await itad.gamePrices(input.ids, input.country);
	}),

	/**
	 * Full price lookup by game name: search → best match → prices.
	 */
	pricesByName: publicProcedure
		.input(gamePricesByNameInput)
		.query(async ({ input }) => {
			const { name, country } = input;
			const itad = ITAD.getInstance();

			// 1. Search for game
			const searchResults = await itad.gameSearch(name);

			// 2. Map to best match
			// Ensure items have a 'name' property for Mapping
			type SearchItem = (typeof searchResults)[number] & { name: string };
			const namedResults: SearchItem[] = searchResults.map((item) => ({
				...item,
				name: (item as any).plain ?? String((item as any).id),
			}));
			const mapping = new Mapping<SearchItem>(name, namedResults);
			const bestMatch = await mapping.compare();
			if (!bestMatch) {
				return { id: null, prices: [], message: "No matching game found" };
			}

			// 3. Determine country (fallback to detected locale)
			const region = country ?? (await getUserCountry());

			// 4. Fetch prices
			const priceList = await itad.gamePrices([bestMatch.id], region);
			return { id: bestMatch.id, prices: priceList };
		}),
});
