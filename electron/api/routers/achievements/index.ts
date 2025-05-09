import { eq } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure, router } from "../../../api/trpc";
import { achievements } from "../../../database/schemas";

export const achievementsRouter = router({
	/**
	 * Retrieves all unlocked achievements for a given game ID.
	 */
	getUnlocked: publicProcedure
		.input(z.object({ gameId: z.string() }))
		.query(async ({ input, ctx }) => {
			try {
				const data = ctx.db
					.select()
					.from(achievements)
					.where(eq(achievements.gameId, input.gameId));

				if (!data) return [];
				return data;
			} catch (error) {
				console.error("[tRPC][achievements.getUnlocked]", error);
				return [];
			}
		}),
});
