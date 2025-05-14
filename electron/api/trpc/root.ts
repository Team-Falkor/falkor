import { achievementsRouter } from "../routers/achievements";
import { appFunctionsRouter } from "../routers/app";
import { downloadQueueRouter } from "../routers/downloads";
import { externalAccountsRouter } from "../routers/external-accounts";
import { igdbRouter } from "../routers/igdb";
import { itadRouter } from "../routers/itad";
import { gameLauncherRouter } from "../routers/launcher";
import { libraryGamesRouter } from "../routers/library";
import { listsRouter } from "../routers/lists";
import { loggingRouter } from "../routers/logging";
import { pluginProvidersRouter } from "../routers/plugins/providers";
import { communityProvidersRouter } from "../routers/plugins/providers/community";
import { protonDbRouter } from "../routers/protondb";
import { realDebridAuthRouter } from "../routers/real-debrid/auth";
import { settingsRouter } from "../routers/settings";
import { updateRouter } from "../routers/update";
import { router } from ".";

export const appRouter = router({
	achachievements: achievementsRouter,
	downloads: downloadQueueRouter,
	accounts: externalAccountsRouter,
	igdb: igdbRouter,
	itad: itadRouter,
	protondb: protonDbRouter,
	launcher: gameLauncherRouter,
	lists: listsRouter,
	logging: loggingRouter,
	library: libraryGamesRouter,
	plugins: {
		providers: pluginProvidersRouter,
		community: communityProvidersRouter,
	},
	settings: settingsRouter,
	update: updateRouter,
	realdebrid: {
		auth: realDebridAuthRouter,
	},
	app: appFunctionsRouter,
});

export type AppRouter = typeof appRouter;
