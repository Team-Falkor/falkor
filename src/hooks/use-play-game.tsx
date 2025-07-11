import { trpc } from "@/lib";

export const usePlayGame = () => {
	const { mutateAsync: playGame, isPending: launchPending } =
		trpc.launcher.launchGame.useMutation();
	const { mutateAsync: stopGame, isPending: stopPending } =
		trpc.launcher.closeGame.useMutation();

	return {
		playGame,
		stopGame,
		isLaunchPending: launchPending,
		isStopPending: stopPending,
	};
};
