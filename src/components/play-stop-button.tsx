import { Play, Square } from "lucide-react";
import type { LibraryGame } from "@/@types";
import { useGameLauncher } from "@/hooks/use-game-launcher";
import { Button } from "./ui/button";

interface PlayStopButtonProps {
	game: LibraryGame;
}

export const PlayStopButton = ({ game }: PlayStopButtonProps) => {
	const { isRunning, initializing, isMutating, toggleGameState } =
		useGameLauncher(game);

	if (!game.installed || !game.gamePath) return null;

	return (
		<Button
			variant={"functional"}
			onClick={(e) => {
				e.stopPropagation();
				e.preventDefault();
				toggleGameState();
			}}
			disabled={initializing || isMutating}
			className="w-full font-semibold uppercase"
		>
			{isRunning ? (
				<>
					<Square className="fill-current" />
					Stop Game
				</>
			) : (
				<>
					<Play className="fill-current" />
					Play Game
				</>
			)}
		</Button>
	);
};
