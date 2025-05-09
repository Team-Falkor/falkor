import { Play } from "lucide-react";
import { MdStop } from "react-icons/md";
import { cn } from "@/lib";

interface PlayStopButtonProps {
	isPlaying: boolean;
	playGame: () => void;
	stopGame: () => void;
}

const PlayStopButton = ({
	isPlaying,
	playGame,
	stopGame,
}: PlayStopButtonProps) => (
	<button
		className={cn(
			"flex items-center justify-center transition-all duration-300",
			"rounded-full bg-primary/80 p-3 hover:scale-110 hover:bg-primary",
			"cursor-pointer shadow-lg backdrop-blur-sm",
			{
				"opacity-0 group-hover:opacity-100": !isPlaying,
				"scale-110": isPlaying,
			},
		)}
		onClick={isPlaying ? stopGame : playGame}
	>
		{isPlaying ? (
			<MdStop size={40} className="text-white" fill="white" />
		) : (
			<Play size={32} className="text-white" fill="white" />
		)}
	</button>
);

export default PlayStopButton;
