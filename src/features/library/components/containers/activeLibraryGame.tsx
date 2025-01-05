import { useMemo } from "react";
import { useGames } from "../../hooks/useGames";
import ContinuePlayingCard from "../cards/continuePlaying";
import { H5 } from "@/components/typography/h5";

const ActiveLibraryGame = () => {
  const { fetchGames, deleteGame, updateGame, games } = useGames(true);

  const gamesCount = useMemo(() => Object.values(games)?.length, [games]);

  return gamesCount ? (
    <div className="flex flex-wrap gap-4">
      {Object.values(games).map((game) => (
        <ContinuePlayingCard
          key={game.id}
          bg_image={game.game_icon ?? ""}
          game={game}
          fetchGames={fetchGames}
          deleteGame={deleteGame}
          updateGame={updateGame}
        />
      ))}
    </div>
  ) : (
    <H5>You have not added any games to continue playing.</H5>
  );
};

export default ActiveLibraryGame;
