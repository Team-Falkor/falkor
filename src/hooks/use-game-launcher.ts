import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { LibraryGame } from "@/@types";
import { trpc } from "@/lib";

export function useGameLauncher(game: LibraryGame) {
	const id = game.id;
	const utils = trpc.useUtils();

	const [isRunning, setIsRunning] = useState(false);
	const [initializing, setInitializing] = useState(true);

	const launch = trpc.launcher.launch.useMutation();
	const stop = trpc.launcher.stop.useMutation();

	const isMutating = launch.isPending || stop.isPending;

	// Initialize running state
	useEffect(() => {
		if (!id) return;

		utils.launcher.isRunning
			.fetch({ id: id })
			.then((res) => setIsRunning(res.running))
			.finally(() => setInitializing(false));
	}, [id, utils.launcher.isRunning]);

	// Subscribe to game state changes
	trpc.launcher.onGameStateChange.useSubscription(undefined, {
		onData(event) {
			if (!id || event.id !== id) return;
			setIsRunning(event.type === "playing");
		},
	});

	const invalidateAll = useCallback(
		() =>
			Promise.all([
				utils.lists.invalidate(undefined, {
					refetchType: "all",
				}),
				utils.launcher.invalidate(undefined, {
					refetchType: "all",
				}),
				utils.library.invalidate(undefined, {
					refetchType: "all",
				}),
			]),
		[utils],
	);

	const toggleGameState = useCallback(async () => {
		if (!id) return;

		try {
			if (isRunning) {
				await stop.mutateAsync({ id });
				toast("Game stopped", { description: game.gameName });
			} else {
				await launch.mutateAsync({ id });
				toast("Game launched", { description: game.gameName });
			}
		} catch (err) {
			console.log(err);
			toast("Action failed", {
				description: String(err)?.split("TRPCClientError: ")?.join(""),
			});
		} finally {
			await invalidateAll();
		}
	}, [id, isRunning, stop, launch, game.gameName, invalidateAll]);

	return {
		isRunning,
		initializing,
		isMutating,
		toggleGameState,
	};
}
