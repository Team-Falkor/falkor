import { cn } from "@/lib";
import { Play } from "lucide-react";
import { MdStop } from "react-icons/md";

interface PlayStopButtonProps {
  isPlaying: boolean;
  playGame: () => void;
  stopGame: () => void;
}

const PlayStopButton: React.FC<PlayStopButtonProps> = ({
  isPlaying,
  playGame,
  stopGame,
}) => (
  <button
    className={cn(
      "flex items-center justify-center transition-all duration-300",
      "rounded-full p-3 bg-primary/80 hover:bg-primary hover:scale-110",
      "shadow-lg backdrop-blur-sm cursor-pointer",
      {
        "opacity-0 group-hover:opacity-100": !isPlaying,
        "scale-110": isPlaying,
      }
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
