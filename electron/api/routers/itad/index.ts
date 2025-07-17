import { publicProcedure, router } from "@backend/api/trpc";
import { ITAD } from "@backend/handlers/api-wrappers/itad";
import { cache } from "@backend/handlers/cache";
import { Mapping } from "@backend/utils/mapping";
import { getUserCountry } from "@backend/utils/utils";
import { z } from "zod";

const CACHE_TTL = {
	STATIC: 24 * 60 * 60 * 1000,
	DYNAMIC: 30 * 60 * 1000,
	PRICES: 15 * 60 * 1000,
};

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
	search: publicProcedure.input(gameSearchInput).query(async ({ input }) => {
		const cacheKey = `itad:search:${input.query}`;
		const cached = await cache.get(cacheKey);
		if (cached) return cached;

		const itad = ITAD.getInstance();
		const result = await itad.gameSearch(input.query);
		await cache.set(cacheKey, result, { ttl: CACHE_TTL.DYNAMIC });
		return result;
	}),

	lookup: publicProcedure.input(gameLookupInput).query(async ({ input }) => {
		const cacheKey = `itad:lookup:${input.id}`;
		const cached = await cache.get(cacheKey);
		if (cached) return cached;

		const itad = ITAD.getInstance();
		const result = await itad.gameLookup(input.id);
		await cache.set(cacheKey, result, { ttl: CACHE_TTL.STATIC });
		return result;
	}),

	info: publicProcedure.input(gameInfoInput).query(async ({ input }) => {
		const cacheKey = `itad:info:${input.id}`;
		const cached = await cache.get(cacheKey);
		if (cached) return cached;

		const itad = ITAD.getInstance();
		const result = await itad.gameInfo(input.id);
		await cache.set(cacheKey, result, { ttl: CACHE_TTL.STATIC });
		return result;
	}),

	prices: publicProcedure.input(gamePricesInput).query(async ({ input }) => {
		const cacheKey = `itad:prices:${input.ids.join(",")}:${input.country ?? "auto"}`;
		const cached = await cache.get(cacheKey);
		if (cached) return cached;

		const itad = ITAD.getInstance();
		const result = await itad.gamePrices(input.ids, input.country);
		await cache.set(cacheKey, result, { ttl: CACHE_TTL.PRICES });
		return result;
	}),

	pricesByName: publicProcedure
		.input(gamePricesByNameInput)
		.query(async ({ input }) => {
			const cacheKey = `itad:pricesByName:${input.name}:${input.country ?? "auto"}`;
			const cached = await cache.get(cacheKey);
			if (cached) return cached;

			const { name, country } = input;
			const itad = ITAD.getInstance();

			const searchResults = await itad.gameSearch(name);

			type SearchItem = (typeof searchResults)[number] & { name: string };
			const namedResults: SearchItem[] = searchResults.map((item) => ({
				...item,
				name: item.title,
			}));
			const mapping = new Mapping<SearchItem>(name, namedResults);
			const bestMatch = await mapping.compare();
			if (!bestMatch) {
				const result = {
					id: null,
					prices: [],
					message: "No matching game found",
				};
				await cache.set(cacheKey, result, { ttl: CACHE_TTL.PRICES });
				return result;
			}

			const region = country ?? (await getUserCountry());
			const priceList = await itad.gamePrices([bestMatch.id], region);
			const result = { id: bestMatch.id, prices: priceList };
			await cache.set(cacheKey, result, { ttl: CACHE_TTL.PRICES });
			return result;
		}),
});
