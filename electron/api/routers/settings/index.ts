import { z } from "zod";
import { publicProcedure, router } from "../../../api/trpc";
import { SettingsManager } from "../../../handlers/settings/settings";

const settings = SettingsManager.getInstance();

export const settingsRouter = router({
	get: publicProcedure.input(z.string()).query(({ input }) => {
		return settings.get(input);
	}),

	update: publicProcedure
		.input(
			z.object({
				path: z.string(),
				value: z.any(),
			}),
		)
		.mutation(({ input }) => {
			try {
				settings.update(input.path, input.value);
				return { success: true };
			} catch (error) {
				console.log(error);
				return { success: false, error: error };
			}
		}),

	reset: publicProcedure.mutation(() => {
		return settings.reset();
	}),

	// reload: publicProcedure.query(() => {
	//   return settings.();
	// }),

	read: publicProcedure.query(() => {
		return settings.getAll();
	}),
});
