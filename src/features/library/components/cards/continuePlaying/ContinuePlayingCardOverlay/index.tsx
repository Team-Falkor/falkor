import { LibraryGame, LibraryGameUpdate } from "@/@types/library/types";
import { P, TypographySmall } from "@/components/ui/typography";
import { useLanguageContext } from "@/contexts/I18N";
import { cn, timeSince } from "@/lib";
import Playtime from "../../../playtime";
import PlayStopButton from "../PlayStopButton";
import ContinuePlayingCardActions from "./actions";

interface ContinuePlayingCardOverlayProps {
  game: LibraryGame;
  isPlaying: boolean;
  playGame: () => void;
  stopGame: () => void;
  deleteGame: (gameId: string) => void;
  updateGame: (gameId: string, updates: LibraryGameUpdate) => void;
  fetchGames: () => void;
}

const ContinuePlayingCardOverlay = ({
  game,
  playGame,
  isPlaying,
  stopGame,
  deleteGame,
  updateGame,
  fetchGames,
}: ContinuePlayingCardOverlayProps) => {
  const { t } = useLanguageContext();

  return (
    <div className="relative flex flex-col justify-between p-3 size-full">
      {/* Top section with playtime and actions */}
      <div className="flex flex-row justify-between w-full">
        <Playtime
          playtime={game.game_playtime}
          className="bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md"
        />
        <ContinuePlayingCardActions
          deleteGame={deleteGame}
          updateGame={updateGame}
          fetchGames={fetchGames}
          game={game}
        />
      </div>

      {/* Middle section with play/stop button */}
      <div className="absolute inset-0 flex items-center justify-center z-30">
        <PlayStopButton
          isPlaying={isPlaying}
          playGame={playGame}
          stopGame={stopGame}
        />
      </div>

      {/* Bottom section with game info */}
      <div className="flex flex-col items-start justify-end mt-auto">
        <TypographySmall
          className={cn(
            "transition-all opacity-0 text-primary-foreground/90 font-medium group-hover:opacity-100 mb-1",
            {
              "opacity-100": isPlaying,
            }
          )}
        >
          {isPlaying ? t("stop_playing") : t("continue_playing")}
        </TypographySmall>
        <P className="font-bold text-white capitalize line-clamp-1 text-lg">
          {game.game_name}
        </P>
        {!!game?.game_last_played && (
          <div className="flex items-center gap-1 mt-1">
            <TypographySmall className="capitalize text-secondary-foreground/90">
              {timeSince(Number(game.game_last_played))}
            </TypographySmall>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContinuePlayingCardOverlay;
