import { LibraryGame, LibraryGameUpdate } from "@/@types/library/types";
import { P } from "@/components/typography/p";
import { TypographySmall } from "@/components/typography/small";
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
    <div className="relative flex flex-col items-start justify-between p-2 size-full">
      <div className="mt-0.5 flex flex-row justify-between w-full h-6">
        <Playtime playtime={game.game_playtime} />
        <ContinuePlayingCardActions
          deleteGame={deleteGame}
          updateGame={updateGame}
          fetchGames={fetchGames}
          game={game}
        />
      </div>

      <div className="flex flex-col items-start justify-end w-full h-full">
        <div className="absolute inset-0 z-20 flex items-center justify-center transition-all">
          <PlayStopButton
            isPlaying={isPlaying}
            playGame={playGame}
            stopGame={stopGame}
          />
        </div>

        <TypographySmall
          className={cn(
            "transition-all opacity-0 text-secondary-foreground/80 group-hover:opacity-100",
            {
              "opacity-100": isPlaying,
            }
          )}
        >
          {isPlaying ? t("stop_playing") : t("continue_playing")}
        </TypographySmall>
        <P className="-mt-1 font-bold text-white capitalize line-clamp-1">
          {game.game_name}
        </P>
        {!!game?.game_last_played && (
          <div className="flex items-center gap-1">
            <TypographySmall className="capitalize text-secondary-foreground/80">
              {timeSince(Number(game.game_last_played))}
            </TypographySmall>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContinuePlayingCardOverlay;
