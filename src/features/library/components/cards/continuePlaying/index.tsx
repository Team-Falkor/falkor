import { LibraryGame, LibraryGameUpdate } from "@/@types/library/types";
import { usePlayGame } from "@/features/library/hooks/usePlayGame";
import { cn } from "@/lib/utils";
import BackgroundImage from "./BackgroundImage";
import ContinuePlayingCardOverlay from "./ContinuePlayingCardOverlay";

type ContinuePlayingCardProps = {
  game: LibraryGame;
  bg_image: string;
  fetchGames: () => void;
  deleteGame: (gameId: string) => void;
  updateGame: (gameId: string, updates: LibraryGameUpdate) => void;
};

const ContinuePlayingCard = ({
  game,
  bg_image,
  fetchGames,
  deleteGame,
  updateGame,
}: ContinuePlayingCardProps) => {
  const { gameRunning, playGame, stopGame } = usePlayGame(
    game.game_path,
    game.game_id,
    fetchGames
  );

  return (
    <div
      className={cn("relative h-44 w-80 rounded-lg overflow-hidden shadow-lg", {
        group: !gameRunning,
      })}
    >
      <BackgroundImage bgImage={bg_image} className="w-full h-full" />
      <div className="absolute inset-0 z-20 w-full h-full bg-black/50">
        <ContinuePlayingCardOverlay
          isPlaying={gameRunning}
          playGame={playGame}
          stopGame={stopGame}
          deleteGame={deleteGame}
          updateGame={updateGame}
          fetchGames={fetchGames}
          game={game}
        />
      </div>
    </div>
  );
};

export default ContinuePlayingCard;
