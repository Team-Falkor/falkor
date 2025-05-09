import { publicProcedure, router } from "@backend/api/trpc";
import { ITAD } from "@backend/handlers/api-wrappers/itad";
import { z } from "zod";

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
});
