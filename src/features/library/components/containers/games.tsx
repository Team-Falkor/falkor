import { LibraryGame, LibraryGameUpdate } from "@/@types/library/types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import ContinuePlayingCard from "../cards/continuePlaying";
import { NewGameCard } from "../cards/newGame";
import NewGameModal from "../modals/newGame";

interface GamesContainerProps {
  games: Record<string, LibraryGame>;
  fetchGames: () => void;
  deleteGame: (gameId: string) => void;
  updateGame: (gameId: string, updates: LibraryGameUpdate) => void;
}

const GamesContainer = ({
  games,
  fetchGames,
  deleteGame,
  updateGame,
}: GamesContainerProps) => {
  return (
    <div className="flex gap-2 overflow-hidden">
      <Dialog>
        <DialogTrigger className="w-[200px] h-full shrink-0 grow-0">
          <NewGameCard />
        </DialogTrigger>

        <NewGameModal />
      </Dialog>

      <div className="flex-1 w-full">
        <Carousel
          opts={{
            skipSnaps: true,
            dragFree: true,
          }}
        >
          <CarouselContent>
            {Object.values(games).map((game) => (
              <CarouselItem className="basis-auto">
                <ContinuePlayingCard
                  key={game.id}
                  bg_image={game.game_icon ?? ""}
                  game={game}
                  fetchGames={fetchGames}
                  deleteGame={deleteGame}
                  updateGame={updateGame}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
};

export default GamesContainer;
