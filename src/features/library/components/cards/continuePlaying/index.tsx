import { LibraryGame, LibraryGameUpdate } from "@/@types/library/types";
import { Card } from "@/components/ui/card";
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
    <Card
      className={cn(
        "relative w-[200px] h-[280px] overflow-hidden shadow-md transition-all duration-300",
        "hover:shadow-xl hover:shadow-primary/10 hover:scale-[1.02]",
        {
          group: !gameRunning,
        }
      )}
    >
      <div className="relative w-full h-full">
        <BackgroundImage
          bgImage={bg_image}
          className="w-full h-full transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 z-10 w-full h-full bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 z-20 w-full h-full">
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
    </Card>
  );
};

export default ContinuePlayingCard;
