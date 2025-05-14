import { publicProcedure, router } from "@backend/api/trpc";
import { createApiUrl } from "@backend/utils/createApiUrl";
import { getErrorMessage } from "@backend/utils/utils";
import type {
	ApiResponse,
	PluginProvider,
	PluginSetupJSON,
} from "@team-falkor/shared-types";
import { z } from "zod";

// Input schema
const getProvidersInput = z.object({
	limit: z.number().optional(),
	offset: z.number().optional(),
	search: z.string().optional(),
});

const addProviderInput = z.object({
	setupJSON: z.custom<PluginSetupJSON>().optional(),
	setupUrl: z.string().optional(),
});

export const communityProvidersRouter = router({
	getProviders: publicProcedure
		.input(getProvidersInput.optional())
		.query(async ({ input }): Promise<ApiResponse<Array<PluginProvider>>> => {
			try {
				const searchParams = new URLSearchParams();
				if (input?.limit) searchParams.append("limit", input.limit.toString());
				if (input?.offset)
					searchParams.append("offset", input.offset.toString());
				if (input?.search) searchParams.append("search", input.search);

				const response = await fetch(
					createApiUrl(`/providers?${searchParams.toString()}`),
				);
				return await response.json();
			} catch (err) {
				return {
					success: false,
					error: true,
					message: getErrorMessage(err),
				};
			}
		}),

	addProvider: publicProcedure
		.input(addProviderInput)
		.mutation(async ({ input }): Promise<ApiResponse<PluginSetupJSON>> => {
			try {
				const response = await fetch(createApiUrl("/providers"), {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(input),
				});
				return await response.json();
			} catch (err) {
				return {
					success: false,
					error: true,
					message: getErrorMessage(err),
				};
			}
		}),
});
