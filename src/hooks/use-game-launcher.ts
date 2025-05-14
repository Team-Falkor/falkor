import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { LibraryGame } from "@/@types";
import { trpc } from "@/lib";

export function useGameLauncher(game: LibraryGame) {
	const gameId = game.id?.toString();
	const utils = trpc.useUtils();

	const [isRunning, setIsRunning] = useState(false);
	const [initializing, setInitializing] = useState(true);

	const launch = trpc.launcher.launch.useMutation();
	const stop = trpc.launcher.stop.useMutation();

	const isMutating = launch.isPending || stop.isPending;

	// Initialize running state
	useEffect(() => {
		if (!gameId) return;

		utils.launcher.isRunning
			.fetch({ gameId })
			.then((res) => setIsRunning(res.running))
			.finally(() => setInitializing(false));
	}, [gameId, utils.launcher.isRunning]);

	// Subscribe to game state changes
	trpc.launcher.onGameStateChange.useSubscription(undefined, {
		onData(event) {
			if (!gameId || event.gameId !== gameId) return;
			setIsRunning(event.type === "playing");
		},
	});

	const invalidateAll = useCallback(
		() =>
			Promise.all([
				utils.lists.invalidate(),
				utils.launcher.invalidate(),
				utils.library.invalidate(),
			]),
		[utils],
	);

	const toggleGameState = useCallback(async () => {
		if (!gameId) return;

		try {
			if (isRunning) {
				await stop.mutateAsync({ gameId });
				toast("Game stopped", { description: game.gameName });
			} else {
				await launch.mutateAsync({ gameId });
				toast("Game launched", { description: game.gameName });
			}
		} catch (err) {
			toast("Action failed", { description: String(err) });
		} finally {
			await invalidateAll();
		}
	}, [gameId, isRunning, stop, launch, game.gameName, invalidateAll]);

	return {
		isRunning,
		initializing,
		isMutating,
		toggleGameState,
	};
}
