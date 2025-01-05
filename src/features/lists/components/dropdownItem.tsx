import Confirmation from "@/components/confirmation";
import { P } from "@/components/typography/p";
import { Button } from "@/components/ui/button";
import { DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { IGDBReturnDataType } from "@/lib/api/igdb/types";
import { TrashIcon } from "lucide-react";
import { PropsWithChildren, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useLists } from "../hooks/useLists";

interface CollectionDropdownItemProps extends PropsWithChildren {
  list_id: number;
  game: IGDBReturnDataType;
}

const ListsDropdownItem = ({
  children,
  list_id,
  game,
}: CollectionDropdownItemProps) => {
  const {
    addGameToList,
    fetchGamesInList,
    gamesInList,
    loading,
    removeGameFromList,
    deleteList,
    fetchLists,
  } = useLists();

  useEffect(() => {
    fetchGamesInList(list_id);
  }, [list_id, fetchGamesInList]);

  const handleSelect = useCallback(async () => {
    const games = gamesInList[list_id] || [];
    const gameExists = games.some((g) => g.game_id === game.id);

    if (gameExists) {
      await removeGameFromList(list_id, game.id);
      console.log("Removing game from list");
      toast.success("Game removed from list");
    } else {
      console.log("Adding game to list");
      await addGameToList(list_id, {
        game_id: game.id,
        title: game.name,
        image: game.cover.url,
        description: game?.storyline ?? game?.summary ?? null,
        release_date: game?.first_release_date?.toString() ?? null,
        genre: game?.genres[0].name ?? null,
      });

      await fetchGamesInList(list_id);

      toast.success("Game added to list");
    }
  }, [
    gamesInList,
    list_id,
    game,
    removeGameFromList,
    addGameToList,
    fetchGamesInList,
  ]);

  const games = gamesInList[list_id] || [];

  return (
    <div className="flex flex-row items-center justify-between gap-1">
      <div className="flex-1">
        <DropdownMenuCheckboxItem
          checked={games.some((g) => g.game_id === game.id)}
          onSelect={handleSelect}
          disabled={loading}
        >
          <P className="truncate">{children || game.name}</P>
        </DropdownMenuCheckboxItem>
      </div>

      {/* TODO: hook up button to delete list */}
      <div className="flex pr-1">
        <Confirmation
          onConfirm={async () => {
            await deleteList(list_id);
            await fetchLists();
          }}
          description="are_you_absolutely_sure_list_delete_description"
        >
          <Button size={"icon"} variant={"ghost"} className="size-5">
            <TrashIcon className="size-5" />
          </Button>
        </Confirmation>
      </div>
    </div>
  );
};

export default ListsDropdownItem;
