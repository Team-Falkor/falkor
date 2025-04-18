import ListCard from "@/components/cards/listCard";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { Pen, TrashIcon } from "lucide-react";
import { useLists } from "../../hooks/useLists";
import { P } from "@/components/ui/typography";

interface ListContainerProps {
  list_id: number;
  list_name: string;
}

const ListContainer = ({ list_id, list_name }: ListContainerProps) => {
  const { fetchGamesInList } = useLists();

  const { isLoading, data, isError } = useQuery({
    queryKey: ["fetchGamesInList", list_id],
    queryFn: async () => await fetchGamesInList(list_id),
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div className="text-red-500">Failed to load games.</div>;

  return (
    <div className="group/list">
      <div className="flex items-center justify-between transition-all">
        <P className="pb-2 capitalize truncate">{list_name}</P>

        {/* Action Bar */}
        <div className="flex items-center justify-end w-2/6 gap-2 transition-all opacity-0 group-hover/list:opacity-100 group-focus-within/list:opacity-100">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" className="p-2 size-8">
                <Pen className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <P>Edit List</P>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" className="p-2 size-8">
                <TrashIcon className="text-red-500 size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <P>Delete List</P>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Carousel or No Games Fallback */}
      {data?.length ? (
        <Carousel
          opts={{
            skipSnaps: true,
            dragFree: true,
          }}
        >
          <CarouselContent>
            {data.map((game) => (
              <CarouselItem className="basis-auto" key={game.game_id}>
                <ListCard {...game} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      ) : (
        <div className="flex items-start justify-start">
          <P className="mt-1 text-center">No games found in this list.</P>
        </div>
      )}
    </div>
  );
};

export default ListContainer;
