import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { LibraryGame } from "@/@types";
import { useLanguageContext } from "@/i18n/I18N";
import { trpc } from "@/lib";

type GameState = "idle" | "launching" | "running" | "stopping" | "error";

export function useGameLauncher(game: LibraryGame) {
	const id = game.id;
	const utils = trpc.useUtils();
	const { t } = useLanguageContext();

	// Local state for game status
	const [gameState, setGameState] = useState<GameState>("idle");
	const [isRunning, setIsRunning] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Query for initial running state
	const { data: runningData, isLoading: isInitialLoading } =
		trpc.launcher.isRunning.useQuery(
			{ id: id },
			{
				enabled: !!id,
				staleTime: 5000, // Cache for 5 seconds
				refetchOnMount: true,
				refetchOnWindowFocus: true,
				refetchInterval: 15000, // Check every 15 seconds
				refetchIntervalInBackground: false,
				refetchOnReconnect: true,
			},
		);

	// Query for session info to get more detailed status
	const { data: sessionInfo } = trpc.launcher.getSessionInfo.useQuery(
		{ id: id },
		{
			enabled: !!id && isRunning,
			refetchInterval: 10000, // Check every 10 seconds when running
			refetchIntervalInBackground: false,
		},
	);

	// Update local state when query data changes
	useEffect(() => {
		if (runningData !== undefined) {
			const running = runningData.running;
			setIsRunning(running);

			// Update game state based on running status
			if (running) {
				setGameState("running");
			} else if (gameState === "running" || gameState === "stopping") {
				setGameState("idle");
			}

			// Clear error when status is successfully retrieved
			setError(null);
		}
	}, [runningData, gameState]);

	// Launch mutation
	const launchMutation = trpc.launcher.launch.useMutation({
		onMutate: () => {
			// Set launching state immediately
			setGameState("launching");
			setError(null);
		},
		onSuccess: (data) => {
			// State will be updated by subscription or next query
			toast.success(t("launcher.game_launched"), {
				description: game.gameName,
			});

			// If polling is required, show additional info
			if ("requiresPolling" in data && data.requiresPolling) {
				toast.info(t("launcher.game_detection"), {
					description: t("launcher.waiting_for_process"),
				});
			}
		},
		onError: (err) => {
			setGameState("error");
			setError(err.message);

			// Extract clean error message
			const cleanMessage = err.message.replace(/^TRPCClientError: /, "");
			toast.error(t("launcher.failed_to_launch"), {
				description: cleanMessage,
			});
		},
		onSettled: () => {
			// Invalidate related queries to refresh data
			utils.launcher.invalidate();
			utils.library.invalidate();
		},
	});

	// Stop mutation
	const stopMutation = trpc.launcher.stop.useMutation({
		onMutate: () => {
			// Set stopping state immediately
			setGameState("stopping");
			setError(null);
		},
		onSuccess: () => {
			// State will be updated by subscription or next query
			toast.success(t("launcher.game_stopped"), {
				description: game.gameName,
			});
		},
		onError: (err) => {
			setGameState("error");
			setError(err.message);

			// Extract clean error message
			const cleanMessage = err.message.replace(/^TRPCClientError: /, "");
			toast.error(t("launcher.failed_to_stop"), {
				description: cleanMessage,
			});
		},
		onSettled: () => {
			// Invalidate related queries to refresh data
			utils.launcher.invalidate();
			utils.library.invalidate();
		},
	});

	// Subscribe to real-time game state changes
	trpc.launcher.onGameStateChange.useSubscription(undefined, {
		onData(event) {
			if (id && event.id === id) {
				const isPlaying = event.type === "playing";
				setIsRunning(isPlaying);

				// Update game state based on event
				if (isPlaying) {
					setGameState("running");
					setError(null);
				} else {
					// Game stopped
					setGameState("idle");
					setError(null);
				}
			}
		},
		onError(err) {
			console.error("Game state subscription error:", err);
			setGameState("error");
			setError(err.message);

			toast.error(t("launcher.real_time_updates_failed"), {
				description: t("launcher.game_status_delayed"),
			});
		},
	});

	// Launch game function
	const launchGame = useCallback(async () => {
		if (!id) {
			toast.error(t("launcher.game_id_missing"));
			return;
		}

		if (gameState === "launching" || gameState === "stopping") {
			return; // Already in progress
		}

		try {
			await launchMutation.mutateAsync({ id });
		} catch (error) {
			// Error is handled by mutation's onError
			console.error("Launch error:", error);
		}
	}, [id, gameState, launchMutation, t]);

	// Stop game function
	const stopGame = useCallback(async () => {
		if (!id) {
			toast.error(t("launcher.game_id_missing"));
			return;
		}

		if (gameState === "launching" || gameState === "stopping") {
			return; // Already in progress
		}

		try {
			await stopMutation.mutateAsync({ id });
		} catch (error) {
			// Error is handled by mutation's onError
			console.error("Stop error:", error);
		}
	}, [id, gameState, stopMutation, t]);

	// Toggle game state function
	const toggleGameState = useCallback(async () => {
		if (isRunning) {
			await stopGame();
		} else {
			await launchGame();
		}
	}, [isRunning, launchGame, stopGame]);

	// Computed states for UI
	const isInitializing = isInitialLoading && runningData === undefined;
	const isLaunching = gameState === "launching";
	const isStopping = gameState === "stopping";
	const isMutating = launchMutation.isPending || stopMutation.isPending;
	const hasError = gameState === "error";

	return {
		// State
		isRunning,
		gameState,
		error,
		sessionInfo,

		// Loading states
		isInitializing,
		isLaunching,
		isStopping,
		isMutating,
		hasError,

		// UI helpers
		isButtonDisabled: isInitializing || isMutating,

		// Actions
		launchGame,
		stopGame,
		toggleGameState,

		// Additional data
		playtime: sessionInfo?.sessionPlaytime || 0,
		pid: sessionInfo?.pid || null,
	};
}
