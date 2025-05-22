import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import ErrorComponent from "./components/errorComponent";
// import ConfirmClose from "./components/confirmClose";
// import ErrorComponent from "./components/errorComponent";
import { ThemeProvider } from "./components/theme-provider";
import { useGamepadNavigation } from "./hooks/use-gamepad-navigation";
import { trpc, trpcClient } from "./lib";
import { memoryHistory } from "./lib/history";
import { routeTree } from "./routeTree.gen";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchInterval: false,
			refetchOnMount: false,
			refetchOnWindowFocus: false,
			refetchIntervalInBackground: false,
		},
	},
});

// Create the router instance
const appRouter = createRouter({
	routeTree,
	history: memoryHistory,
	context: {
		queryClient,
	},
	defaultPreload: "intent",
	defaultPreloadStaleTime: 0,
	defaultErrorComponent: (props) => <ErrorComponent {...props} />,
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof appRouter;
	}
}

function App() {
	useGamepadNavigation();
	// useThemes();

	return (
		<ThemeProvider defaultTheme="dark" storageKey="ui-theme">
			<trpc.Provider client={trpcClient} queryClient={queryClient}>
				{/* {!hasLoaded && <SplashScreen />} */}
				<QueryClientProvider client={queryClient}>
					{/* <ConfirmClose /> */}
					<Toaster />
					<RouterProvider router={appRouter} />
				</QueryClientProvider>
			</trpc.Provider>
		</ThemeProvider>
	);
}

export default App;
