import { Skeleton } from "@/components/ui/skeleton";

const BannerSkeleton = () => {
	return (
		<Skeleton className="h-[24rem] w-full rounded-lg sm:h-[28rem] lg:h-[32rem] xl:h-[36rem]" />
	);
};

export default BannerSkeleton;
