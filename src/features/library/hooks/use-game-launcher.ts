import { trpc } from "@/lib";

export function useGameLauncher() {
	const utils = trpc.useUtils();

	const { data: runningGames = [] } = trpc.launcher.getRunningGames.useQuery();

	const isGameRunning = trpc.launcher.isGameRunning.useQuery;

	const { mutate: launchGame } = trpc.launcher.launchGame.useMutation({
		onSuccess: () => {
			utils.launcher.getRunningGames.invalidate(undefined, {
				refetchType: "all",
				type: "all",
			});
		},
	});

	const { mutate: stopGame } = trpc.launcher.closeGame.useMutation({
		onSuccess: () => {
			utils.launcher.getRunningGames.invalidate(undefined, {
				refetchType: "all",
				type: "all",
			});
		},
	});

	// Subscribe to game state changes
	// trpc.launcher.onGameStateChange.useSubscription(undefined, {
	// 	onData: () => {
	// 		utils.launcher.getRunning.invalidate(undefined, {
	// 			refetchType: "all",
	// 			type: "all",
	// 		});
	// 	},
	// });

	return {
		isGameRunning,
		launchGame,
		stopGame,
		runningGames,
	};
}
