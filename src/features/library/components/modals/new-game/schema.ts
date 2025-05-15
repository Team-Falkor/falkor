import { z } from "zod";

export const newGameFormSchema = z.object({
	gameName: z.string().min(1, { message: "Required" }),
	gamePath: z.string().min(1, { message: "Required" }),
	gameId: z.string().min(1, { message: "Required" }),
	gameIcon: z.string().min(1, { message: "Required" }),
	gameArgs: z.string().optional(),
	gameCommand: z
		.string()
		.optional()
		.refine((s) => !s?.includes(" "), "No Spaces!"),
	igdbId: z.string().optional(),
	steamId: z.string().optional(),
	winePrefixFolder: z.string().optional(),
	installed: z.boolean().optional(),
});

export type NewGameFormSchema = z.infer<typeof newGameFormSchema>;
