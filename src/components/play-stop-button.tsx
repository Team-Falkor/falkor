import { StopIcon } from "@radix-ui/react-icons";
import { Play } from "lucide-react";
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
		>
			{isRunning ? (
				<>
					<StopIcon className="fill-black dark:fill-white" />
					Stop Game
				</>
			) : (
				<>
					<Play className="fill-black dark:fill-white" />
					Play Game
				</>
			)}
			<Play className="fill-black dark:fill-white" />
			Play Game
		</Button>
	);
};
