import { trpc } from "@/lib";

export const usePlayGame = () => {
	const { mutateAsync: playGame, isPending: launchPending } =
		trpc.launcher.launch.useMutation();
	const { mutateAsync: stopGame, isPending: stopPending } =
		trpc.launcher.stop.useMutation();

	return {
		playGame,
		stopGame,
		isLaunchPending: launchPending,
		isStopPending: stopPending,
	};
};
