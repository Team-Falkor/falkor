import { publicProcedure, router } from "@backend/api/trpc";
import { getTorBoxTorrentsInstance } from "@backend/handlers/api-wrappers/torbox/services/torrents";
import { z } from "zod";

export const torBoxTorrentsRouter = router({
	instantAvailability: publicProcedure
		.input(
			z.object({
				apiKey: z.string(),
				hashes: z.array(z.string()),
			}),
		)
		.mutation(async ({ input }) => {
			try {
				const torrentsService = getTorBoxTorrentsInstance(input.apiKey);
				const result = await torrentsService.instantAvailability(input.hashes);
				return result ?? [];
			} catch (error) {
				throw new Error(
					error instanceof Error
						? error.message
						: "Failed to check availability",
				);
			}
		}),
});
