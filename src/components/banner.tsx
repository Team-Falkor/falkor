import type { HTMLAttributes } from "react";
import { cn, trpc } from "@/lib";
import BannerCard from "./cards/bannerCard";
import BannerSkeleton from "./skeletons/banner";
import { CarouselContent, CarouselItem } from "./ui/carousel";

type Props = HTMLAttributes<HTMLDivElement>;

const Banner = ({ className, ...props }: Props) => {
	const { data, error, isPending } = trpc.igdb.top_rated.useQuery({});

	if (isPending) return <BannerSkeleton />;

	if (error) return <div>Error</div>;

	return (
		<div className={cn("w-full", className)} {...props}>
			<CarouselContent>
				{!!data?.length &&
					data?.map((game) => (
						<CarouselItem key={game.id}>
							<BannerCard {...game} />
						</CarouselItem>
					))}
			</CarouselContent>
		</div>
	);
};

export default Banner;
