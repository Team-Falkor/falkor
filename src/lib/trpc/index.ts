import { ipcLink } from "@janwirth/electron-trpc-link/renderer";
import { createTRPCReact, loggerLink } from "@trpc/react-query";
import type { AppRouter } from "../../../electron/api/trpc/root";

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
	links: [
		loggerLink({
			enabled: () => {
				return window.env.IS_DEV === true && process.env.NODE_ENV !== "test";
			},
		}),
		ipcLink(),
	],
});
