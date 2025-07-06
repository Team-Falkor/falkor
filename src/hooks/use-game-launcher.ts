import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { LibraryGame } from "@/@types";
import { trpc } from "@/lib";

type GameState = "idle" | "launching" | "running" | "stopping" | "error";

export function useGameLauncher(game: LibraryGame) {
	const id = game.id;
	const utils = trpc.useUtils();

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
			toast.success("Game launched successfully", {
				description: game.gameName,
			});

			// If polling is required, show additional info
			if ("requiresPolling" in data && data.requiresPolling) {
				toast.info("Game detection", {
					description: "Waiting for game process to be detected...",
				});
			}
		},
		onError: (err) => {
			setGameState("error");
			setError(err.message);

			// Extract clean error message
			const cleanMessage = err.message.replace(/^TRPCClientError: /, "");
			toast.error("Failed to launch game", {
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
			toast.success("Game stopped", {
				description: game.gameName,
			});
		},
		onError: (err) => {
			setGameState("error");
			setError(err.message);

			// Extract clean error message
			const cleanMessage = err.message.replace(/^TRPCClientError: /, "");
			toast.error("Failed to stop game", {
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

			toast.error("Real-time updates failed", {
				description: "Game status updates may be delayed.",
			});
		},
	});

	// Launch game function
	const launchGame = useCallback(async () => {
		if (!id) {
			toast.error("Game ID is missing");
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
	}, [id, gameState, launchMutation]);

	// Stop game function
	const stopGame = useCallback(async () => {
		if (!id) {
			toast.error("Game ID is missing");
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
	}, [id, gameState, stopMutation]);

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

	// Button text based on state
	const getButtonText = () => {
		switch (gameState) {
			case "launching":
				return "Launching...";
			case "stopping":
				return "Stopping...";
			case "running":
				return "Stop Game";
			case "error":
				return "Retry";
			default:
				return "Launch Game";
		}
	};

	// Button disabled state
	const isButtonDisabled = isInitializing || isMutating;

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
		buttonText: getButtonText(),
		isButtonDisabled,

		// Actions
		launchGame,
		stopGame,
		toggleGameState,

		// Additional data
		playtime: sessionInfo?.sessionPlaytime || 0,
		pid: sessionInfo?.pid || null,
	};
}
