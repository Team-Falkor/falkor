import { Play } from "lucide-react";
import { MdStop } from "react-icons/md";

import type { LibraryGame } from "@/@types";
import { useGameLauncher } from "@/hooks/use-game-launcher";
import { cn } from "@/lib";

interface PlayStopButtonProps {
	game: LibraryGame;
}

const PlayStopButton = ({ game }: PlayStopButtonProps) => {
	const { isRunning, initializing, isMutating, toggleGameState } =
		useGameLauncher(game);

	if (!game.installed || !game.gamePath) return null;

	const buttonTitle = initializing
		? "Checking…"
		: isRunning
			? "Stop Game"
			: "Launch Game";

	return (
		<button
			onClick={(e) => {
				toggleGameState();
				e.stopPropagation();
				e.preventDefault();
			}}
			disabled={initializing || isMutating}
			type="button"
			title={buttonTitle}
			className={cn(
				"flex items-center justify-center rounded-full p-3 shadow-lg backdrop-blur-sm",
				"bg-primary/80 transition-all duration-300 hover:scale-110 hover:bg-primary",
				"cursor-pointer text-white",
				{
					"opacity-0 group-hover:opacity-100": !isRunning,
					"scale-110": isRunning,
					"pointer-events-none opacity-50": initializing || isMutating,
				},
			)}
		>
			{isRunning ? (
				<MdStop size={40} fill="white" />
			) : (
				<Play size={32} fill="white" />
			)}
		</button>
	);
};

export default PlayStopButton;
