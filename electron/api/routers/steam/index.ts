import { publicProcedure, router } from "@backend/api/trpc";
import { SteamApi } from "@backend/handlers/api-wrappers/steam";

const steamApi = SteamApi.getInstance();
const returnTo = "https://falkor.moe/deep-link/steam-login";

export const steamRouter = router({
	getLoginUrl: publicProcedure.query(() => {
		return steamApi.getLoginUrl(returnTo);
	}),
});
