import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { useMemo } from "react";
import { useGames } from "../hooks/useGames";
import { NewGameCard } from "./cards/newGame";
import GamesContainer from "./containers/games";
import NewGameModal from "./modals/newGame";

const ContinuePlaying = () => {
  const { games, fetchGames, deleteGame, updateGame } = useGames();

  const games_count = useMemo(() => Object.values(games)?.length, [games]);

  if (games_count)
    return (
      <GamesContainer
        games={games}
        fetchGames={fetchGames}
        deleteGame={deleteGame}
        updateGame={updateGame}
      />
    );

  return (
    <Dialog>
      <DialogTrigger>
        <NewGameCard />
      </DialogTrigger>

      <NewGameModal />
    </Dialog>
  );
};

export default ContinuePlaying;
