import { trpc } from "@/lib";

export function useGameLauncher() {
	const utils = trpc.useUtils();

	const { data: runningGames = [] } = trpc.launcher.getRunning.useQuery();

	const isGameRunning = (gameId: string) => {
		return runningGames.includes(gameId);
	};

	const { mutate: launchGame } = trpc.launcher.launch.useMutation({
		onSuccess: () => {
			utils.launcher.getRunning.invalidate(undefined, {
				refetchType: "all",
				type: "all",
			});
		},
	});

	const { mutate: stopGame } = trpc.launcher.stop.useMutation({
		onSuccess: () => {
			utils.launcher.getRunning.invalidate(undefined, {
				refetchType: "all",
				type: "all",
			});
		},
	});

	// Subscribe to game state changes
	trpc.launcher.onGameStateChange.useSubscription(undefined, {
		onData: () => {
			utils.launcher.getRunning.invalidate(undefined, {
				refetchType: "all",
				type: "all",
			});
		},
	});

	return {
		isGameRunning,
		launchGame,
		stopGame,
		runningGames,
	};
}
