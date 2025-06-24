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
	const launchMutation = trpc.launcher.launch.useMutation();
	const stopMutation = trpc.launcher.stop.useMutation();

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

	// Invalidation function to refetch all relevant queries
	const invalidateAll = useCallback(async () => {
		await Promise.allSettled([
			utils.lists.invalidate(),
			utils.launcher.invalidate(),
			utils.library.invalidate(),
		]);
	}, [utils]);

	const toggleGameState = useCallback(async () => {
		if (!id) {
			toast.error("Game ID is missing.");
			return;
		}

		// Optimistically update the UI to reflect the intended state
		const previousRunningState = isRunning;
		const targetRunningState = !isRunning;
		setIsRunning(targetRunningState);

		try {
			if (previousRunningState) {
				// If the game was running, attempt to stop it
				await stopMutation.mutateAsync({ id });
				toast.success("Game stopped", { description: game.gameName });
			} else {
				// If the game was not running, attempt to launch it
				await launchMutation.mutateAsync({ id });
				toast.success("Game launched", { description: game.gameName });
			}
		} catch (err) {
			// Revert the optimistic update if the mutation fails
			setIsRunning(previousRunningState);

			// Log the full error for debugging purposes
			console.error("Game action failed:", err);

			// Extract a user-friendly error message
			let errorMessage = "An unknown error occurred.";
			if (err instanceof Error) {
				errorMessage = err.message;
			} else if (
				typeof err === "object" &&
				err !== null &&
				"message" in err &&
				typeof err.message === "string"
			) {
				errorMessage = err.message;
			}
			// Clean up the TRPCClientError prefix if it exists
			errorMessage = errorMessage.replace(/^TRPCClientError: /, "");

			toast.error("Action failed", {
				description: errorMessage,
			});
		} finally {
			// Invalidate queries to ensure data consistency with the backend,
			// regardless of optimistic update success or failure.
			await invalidateAll();
		}
	}, [
		id,
		isRunning,
		stopMutation,
		launchMutation,
		game.gameName,
		invalidateAll,
	]);

	return {
		isRunning,
		initializing,
		isMutating,
		toggleGameState,
	};
}
