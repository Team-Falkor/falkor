import type { HTMLAttributes } from "react";
import { cn, trpc } from "@/lib";
import BannerCard from "./cards/bannerCard";
import BannerSkeleton from "./skeletons/banner";
import { CarouselContent, CarouselItem } from "./ui/carousel";

type Props = HTMLAttributes<HTMLDivElement>;

const Banner = ({ className, ...props }: Props) => {
	const { data, error, isPending } = trpc.igdb.top_rated.useQuery(
		{},
		{
			refetchOnReconnect: true,
			refetchOnWindowFocus: false,
			refetchOnMount: false,
			refetchInterval: 1000 * 60 * 60 * 1, // 1 hour (1000ms * 60s * 60m * 1)
			refetchIntervalInBackground: false,
		},
	);

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
