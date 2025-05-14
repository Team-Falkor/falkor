import { trpc } from "@/lib";
import DefaultCard from "./cards/defaultCard";
import GenericRowSkeleton from "./skeletons/genericRow";
import { CarouselContent, CarouselItem } from "./ui/carousel";

interface GenericRowProps {
	dataToFetch: "most_anticipated" | "top_rated" | "new_releases";
}

const GenericRow = ({ dataToFetch }: GenericRowProps) => {
	const { data, isPending, error } = trpc.igdb[dataToFetch].useQuery({});

	if (isPending) return <GenericRowSkeleton />;
	if (error || !data?.length) return null;

	return (
		<CarouselContent className="px-3">
			{!!data?.length &&
				data?.map((game) => (
					<CarouselItem
						key={game.id}
						className="basis-auto px-2"
						id={"carousel-item"}
					>
						<DefaultCard key={game.id} {...game} />
					</CarouselItem>
				))}
		</CarouselContent>
	);
};

export default GenericRow;
