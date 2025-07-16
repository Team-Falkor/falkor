import { achievementsRouter } from "../routers/achievements";
import { appFunctionsRouter } from "../routers/app";
import { downloadQueueRouter } from "../routers/downloads";
import { externalAccountsRouter } from "../routers/external-accounts";
import { gameLocatorRouter } from "../routers/game-locator";
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
import { steamRouter } from "../routers/steam";
import { torBoxAuthRouter } from "../routers/torbox/auth";
import { torBoxTorrentsRouter } from "../routers/torbox/torrents";
import { router } from ".";

export const appRouter = router({
	achievements: achievementsRouter,
	downloads: downloadQueueRouter,
	accounts: externalAccountsRouter,
	gameLocator: gameLocatorRouter,
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
	realdebrid: {
		auth: realDebridAuthRouter,
	},
	torbox: {
		auth: torBoxAuthRouter,
		torrents: torBoxTorrentsRouter,
	},
	app: appFunctionsRouter,
	steam: steamRouter,
});

export type AppRouter = typeof appRouter;
