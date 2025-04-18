import { LibraryGame } from "@/@types/library/types";
import { usePlayGame } from "@/features/library/hooks/usePlayGame";
import { cn } from "@/lib";
import { Play } from "lucide-react";
import { MdStop } from "react-icons/md";

const NavBarContinuePlayingCard = ({
  game_id,
  game_icon,
  game_name,
  game_path,
}: LibraryGame) => {
  const { gameRunning, playGame, stopGame } = usePlayGame(game_path, game_id);
  const isRemoteImage = /^https?:\/\//i.test(game_icon ?? "");
  const realImagePath = isRemoteImage
    ? game_icon
    : `local:${encodeURI(game_icon ?? "")}`;

  return (
    <div
      className="relative flex items-center justify-center w-full h-full overflow-hidden rounded-lg cursor-pointer group"
      onClick={gameRunning ? stopGame : playGame}
    >
      <img
        src={realImagePath}
        alt={game_name}
        className="object-cover w-full h-full"
      />

      {/* OVERLAY */}
      <div
        className={cn(
          "absolute inset-0 z-10 flex items-center justify-center px-2 py-1 transition-all opacity-0 bg-black/50 size-full group-hover:opacity-80",
          {
            "opacity-100": gameRunning,
          }
        )}
      >
        {gameRunning ? (
          <MdStop className="text-white size-full fill-white" />
        ) : (
          <Play className="text-white size-full fill-white" />
        )}
      </div>
    </div>
  );
};

export default NavBarContinuePlayingCard;
