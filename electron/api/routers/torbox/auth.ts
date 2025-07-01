import { publicProcedure, router } from "@backend/api/trpc";
import { getTorBoxUserInstance } from "@backend/handlers/api-wrappers/torbox/services/user";
import { z } from "zod";
import type { TorBoxUser } from "@/@types/accounts";

export type TorBoxAuthResult = { user: TorBoxUser } | { error: Error };

export const torBoxAuthRouter = router({
	validateKey: publicProcedure
		.input(z.object({ apiKey: z.string() }))
		.mutation(async ({ input }) => {
			try {
				const user = await getTorBoxUserInstance(input.apiKey).getUserInfo();
				return { user };
			} catch (e: any) {
				return { error: new Error(e?.message ?? "Invalid key") };
			}
		}),
});
