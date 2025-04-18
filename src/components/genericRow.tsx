import { igdb } from "@/lib";
import { useQuery } from "@tanstack/react-query";
import DefaultCard from "./cards/defaultCard";
import GenericRowSkeleton from "./skeletons/genericRow";
import { CarouselContent, CarouselItem } from "./ui/carousel";

interface GenericRowProps {
  dataToFetch: "mostAnticipated" | "topRated" | "newReleases";
  fetchKey: string[];
}

const GenericRow = ({ dataToFetch, fetchKey }: GenericRowProps) => {
  const fetcher = async () => {
    const data = await igdb[dataToFetch]();
    return data;
  };

  const { data, isPending, error } = useQuery({
    queryKey: ["igdb", ...fetchKey],
    queryFn: fetcher,
  });

  if (isPending) return <GenericRowSkeleton />;
  if (error) return null;

  return (
    <CarouselContent className="px-3">
      {!!data?.length &&
        data?.map((game) => (
          <CarouselItem
            key={game.id}
            className="px-2 basis-auto"
            id={`carousel-item`}
          >
            <DefaultCard key={game.id} {...game} />
          </CarouselItem>
        ))}
    </CarouselContent>
  );
};

export default GenericRow;
