import { useCallback, useEffect, useState } from "react";
import type { LibraryGame } from "@/@types";
import { useLanguageContext } from "@/i18n/I18N";
import { trpc } from "@/lib";

export function useGameLauncher(game: LibraryGame) {
	const id = game.id;
	const gameId = game.gameId;
	const utils = trpc.useUtils();
	const { t } = useLanguageContext();

	// Local state for game status
	const [isRunning, setIsRunning] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [shouldPoll, setShouldPoll] = useState(false);

	// Smart polling: only poll when game is running or we need to check status
	const {
		data: gameRunningData,
		refetch: refetchRunningStatus,
		isFetching: isCheckingStatus,
		isError: isRunningQueryError,
		error: runningQueryError,
	} = trpc.launcher.isGameRunning.useQuery(gameId, {
		// Only enable polling when game is running or we explicitly want to check
		refetchInterval: shouldPoll ? 2000 : false,
		refetchIntervalInBackground: shouldPoll,
		staleTime: 1000, // Consider data stale after 1 second
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
		// Disable query when not needed to save resources
		enabled: shouldPoll || isRunning,
	});

	const { data: gameInfoData, isLoading: isLoadingGameInfo } =
		trpc.launcher.getGameInfo.useQuery(gameId, {
			staleTime: 5 * 60 * 1000,
		});

	// tRPC mutations with modern patterns
	const launchGameMutation = trpc.launcher.launchGame.useMutation({
		onSuccess: () => {
			setError(null);
			// Enable polling after successful launch to monitor game status
			setShouldPoll(true);
			// Invalidate and refetch related queries
			utils.launcher.isGameRunning.invalidate();
			utils.launcher.getRunningGames.invalidate();
			utils.launcher.getGameInfo.invalidate();
		},
		onError: (error) => {
			setError(error.message || t("Failed to launch game"));
			// Disable polling if launch failed
			setShouldPoll(false);
		},
		onMutate: () => {
			// Clear any previous errors when starting mutation
			setError(null);
			// Enable polling during launch attempt
			setShouldPoll(true);
		},
	});

	const closeGameMutation = trpc.launcher.closeGame.useMutation({
		onSuccess: () => {
			setError(null);
			// Disable polling after successful close since game is no longer running
			setShouldPoll(false);
			// Invalidate and refetch related queries
			utils.launcher.isGameRunning.invalidate();
			utils.launcher.getRunningGames.invalidate();
			utils.launcher.getGameInfo.invalidate();
		},
		onError: (error) => {
			setError(error.message || t("Failed to close game"));
		},
		onMutate: () => {
			// Clear any previous errors when starting mutation
			setError(null);
		},
	});

	// Update local state when query data changes
	useEffect(() => {
		if (gameRunningData?.isRunning !== undefined) {
			setIsRunning(gameRunningData.isRunning);
		}
	}, [gameRunningData?.isRunning]);

	// Smart polling management: disable polling when game stops running
	useEffect(() => {
		if (gameRunningData?.isRunning === false && shouldPoll) {
			// Game stopped running, disable polling after a short delay
			// to allow for any final status checks
			const timer = setTimeout(() => {
				setShouldPoll(false);
			}, 5000); // 5 second grace period
			return () => clearTimeout(timer);
		}
	}, [gameRunningData?.isRunning, shouldPoll]);

	// Handle query errors
	useEffect(() => {
		if (isRunningQueryError && runningQueryError) {
			setError(runningQueryError.message || t("Failed to check game status"));
		}
	}, [isRunningQueryError, runningQueryError, t]);

	// Clear error when game status changes successfully
	useEffect(() => {
		if (isRunning && !isRunningQueryError) {
			setError(null);
		}
	}, [isRunning, isRunningQueryError]);

	// Memoized action functions to prevent unnecessary re-renders
	const launchGame = useCallback(
		async (args?: string[]) => {
			try {
				await launchGameMutation.mutateAsync({ id, args });
			} catch (error) {
				// Error is already handled in onError callback
				console.error("Launch game error:", error);
			}
		},
		[launchGameMutation, id],
	);

	const closeGame = useCallback(async () => {
		try {
			await closeGameMutation.mutateAsync(gameId);
		} catch (error) {
			// Error is already handled in onError callback
			console.error("Close game error:", error);
		}
	}, [closeGameMutation, gameId]);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	const refreshStatus = useCallback(() => {
		// Enable polling when manually checking status
		setShouldPoll(true);
		return refetchRunningStatus();
	}, [refetchRunningStatus]);

	const togglePolling = useCallback((enabled: boolean) => {
		setShouldPoll(enabled);
	}, []);

	return {
		// State
		isRunning,
		error,
		gameInfo: gameInfoData?.gameInfo,
		isPolling: shouldPoll, // Expose polling state for UI feedback

		// Loading states (using modern TanStack Query properties)
		isLaunching: launchGameMutation.isPending,
		isClosing: closeGameMutation.isPending,
		isCheckingStatus,
		isLoadingGameInfo,

		// Success states
		isLaunchSuccess: launchGameMutation.isSuccess,
		isCloseSuccess: closeGameMutation.isSuccess,

		// Actions
		launchGame,
		closeGame,
		clearError,
		refreshStatus,
		togglePolling, // Manual polling control

		// Raw mutation objects for advanced usage
		launchGameMutation,
		closeGameMutation,

		// Query utilities for advanced cache management
		utils: {
			invalidateGameStatus: () => utils.launcher.isGameRunning.invalidate(),
			invalidateGameInfo: () => utils.launcher.getGameInfo.invalidate(),
			invalidateRunningGames: () => utils.launcher.getRunningGames.invalidate(),
			invalidateAll: () => utils.launcher.invalidate(),
		},
	};
}
