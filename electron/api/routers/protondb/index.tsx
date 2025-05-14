import { publicProcedure, router } from "@backend/api/trpc";
import { z } from "zod";
import type { ProtonDBSummary } from "@/@types";

export const protonDbRouter = router({
	getBadge: publicProcedure
		.input(
			z.object({
				appId: z.string(),
			}),
		)
		.query(async ({ input }) => {
			const { appId } = input;
			const fetched = await fetch(
				`https://www.protondb.com/api/v1/reports/summaries/${appId}.json`,
			);

			if (!fetched?.ok) return null;

			const response = (await fetched.json()) as ProtonDBSummary;

			return response;
		}),
});
