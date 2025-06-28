import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { LibraryGame } from "@/@types";
import { trpc } from "@/lib";

export function useGameLauncher(game: LibraryGame) {
	const id = game.id;
	const utils = trpc.useUtils();

	// Use useQuery for initial state fetching
	const { data: initialIsRunningData, isLoading: isInitialLoading } =
		trpc.launcher.isRunning.useQuery(
			{ id: id },
			{
				enabled: !!id, // Only fetch if ID is available
				staleTime: Number.POSITIVE_INFINITY, // Assume running status doesn't change unexpectedly from other clients
			},
		);

	const [isRunning, setIsRunning] = useState(false);

	// Update local state once initial data is loaded
	useEffect(() => {
		if (initialIsRunningData !== undefined) {
			setIsRunning(initialIsRunningData.running);
		}
	}, [initialIsRunningData]);

	// Mutations for launching and stopping the game
	const launchMutation = trpc.launcher.launch.useMutation({
		onSuccess: () => {
			toast.success("Game launched", { description: game.gameName });
		},
		onError: (err) => {
			toast.error("Launch failed", {
				description: err.message.replace(/^TRPCClientError: /, ""),
			});
		},
		onSettled: () => {
			utils.launcher.invalidate();
			utils.library.invalidate();
		},
	});

	const stopMutation = trpc.launcher.stop.useMutation({
		onSuccess: () => {
			toast.success("Game stopped", { description: game.gameName });
		},
		onError: (err) => {
			toast.error("Stop failed", {
				description: err.message.replace(/^TRPCClientError: /, ""),
			});
		},
		onSettled: () => {
			utils.launcher.invalidate();
			utils.library.invalidate();
		},
	});

	// Combined loading state for mutations and initial fetch
	const isMutating = launchMutation.isPending || stopMutation.isPending;
	const initializing = isInitialLoading || initialIsRunningData === undefined;

	// Subscribe to real-time game state changes
	trpc.launcher.onGameStateChange.useSubscription(undefined, {
		onData(event) {
			if (id && event.id === id) {
				setIsRunning(event.type === "playing");
			}
		},
		onError(err) {
			console.error("Game state subscription error:", err);
			toast.error("Real-time game status updates failed.", {
				description:
					err instanceof Error ? err.message : "An unknown error occurred.",
			});
		},
	});

	const toggleGameState = useCallback(async () => {
		if (!id) {
			toast.error("Game ID is missing.");
			return;
		}

		// Optimistically update the UI
		setIsRunning(!isRunning);

		try {
			if (isRunning) {
				await stopMutation.mutateAsync({ id });
			} else {
				await launchMutation.mutateAsync({ id });
			}
		} catch {
			// Revert optimistic update on error, which is handled by the mutation's onError callback
			setIsRunning(isRunning);
		}
	}, [id, isRunning, stopMutation, launchMutation]);

	return {
		isRunning,
		initializing,
		isMutating,
		toggleGameState,
	};
}
