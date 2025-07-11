import { AlertCircle, Loader2, Play, Square } from "lucide-react";
import type { LibraryGame } from "@/@types";
import { useGameLauncher } from "@/hooks/use-game-launcher";
import { useLanguageContext } from "@/i18n/I18N";
import { Button } from "./ui/button";

interface PlayStopButtonProps {
	game: LibraryGame;
}

export const PlayStopButton = ({ game }: PlayStopButtonProps) => {
	const { t } = useLanguageContext();
	const {
		isRunning,
		isLaunching,
		isClosing,
		error,
		launchGame,
		closeGame,
		clearError,
	} = useGameLauncher(game);

	if (!game.installed || !game.gamePath) return null;

	// Determine current game state for UI logic
	const gameState = (() => {
		if (error) return "error";
		if (isLaunching && !isRunning) return "launching";
		if (isClosing) return "stopping";
		if (isRunning) return "running";
		return "idle";
	})();

	// Determine if button should be disabled
	const isButtonDisabled = (isLaunching && !isRunning) || isClosing;

	// Determine button variant based on game state
	const getButtonVariant = () => {
		switch (gameState) {
			case "launching":
				return "warning"; // Yellow for launching
			case "running":
				return "success"; // Green for running/stop
			case "stopping":
				return "warning"; // Yellow for stopping
			case "error":
				return "destructive"; // Red for errors
			default:
				return "functional"; // Blue for play
		}
	};

	// Determine icon based on game state
	const getIcon = () => {
		switch (gameState) {
			case "launching":
				return <Loader2 className="animate-spin" />;
			case "running":
				return <Square className="fill-current" />;
			case "stopping":
				return <Loader2 className="animate-spin" />;
			case "error":
				return <AlertCircle />;
			default:
				return <Play className="fill-current" />;
		}
	};

	// Get button text with i18n support
	const getButtonText = () => {
		switch (gameState) {
			case "launching":
				return t("launcher.launching");
			case "stopping":
				return t("launcher.stopping");
			case "running":
				return t("launcher.stop_game");
			case "error":
				return t("launcher.retry");
			default:
				return t("launcher.play_game");
		}
	};

	// Handle button click based on current state
	const handleClick = async () => {
		if (error) {
			// Clear error and try again
			clearError();
			return;
		}

		if (isRunning) {
			// Stop the game
			await closeGame();
		} else {
			// Launch the game
			await launchGame();
		}
	};

	return (
		<Button
			variant={getButtonVariant()}
			onClick={(e) => {
				e.stopPropagation();
				e.preventDefault();
				handleClick();
			}}
			disabled={isButtonDisabled}
			className="w-full font-semibold uppercase"
			title={error || undefined} // Show error as tooltip if present
		>
			{getIcon()}
			{getButtonText()}
		</Button>
	);
};
