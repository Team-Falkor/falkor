import { AlertCircle, Loader2, Play, Square } from "lucide-react";
import type { LibraryGame } from "@/@types";
import { useGameLauncher } from "@/hooks/use-game-launcher";
import { Button } from "./ui/button";

interface PlayStopButtonProps {
	game: LibraryGame;
}

export const PlayStopButton = ({ game }: PlayStopButtonProps) => {
	const { gameState, isButtonDisabled, toggleGameState, error } =
		useGameLauncher(game);

	if (!game.installed || !game.gamePath) return null;

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

	// Get button text with fallback
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
				return "Play Game";
		}
	};

	return (
		<Button
			variant={getButtonVariant()}
			onClick={(e) => {
				e.stopPropagation();
				e.preventDefault();
				toggleGameState();
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
