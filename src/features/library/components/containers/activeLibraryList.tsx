import ListCard from "@/components/cards/listCard";
import { H5, P } from "@/components/ui/typography";
import { useLists } from "@/features/lists/hooks/useLists";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

interface ActiveLibraryListProps {
  listId: number;
}

const ActiveLibraryList = ({ listId }: ActiveLibraryListProps) => {
  const { fetchGamesInList } = useLists();

  const { data, isPending, isError } = useQuery({
    queryKey: ["library", listId],
    queryFn: async () => {
      return await fetchGamesInList(listId);
    },
  });

  const listCount = useMemo(() => data?.length, [data]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center">
        <H5>Loading...</H5>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center">
        <H5>Something went wrong. Please try again later.</H5>
      </div>
    );
  }

  return listCount ? (
    <div className="flex flex-wrap gap-4">
      {data.map((game) => (
        <ListCard key={game.game_id} {...game} />
      ))}
    </div>
  ) : (
    <P>No games in this list.</P>
  );
};

export default ActiveLibraryList;
