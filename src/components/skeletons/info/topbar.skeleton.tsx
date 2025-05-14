import { Skeleton } from "@/components/ui/skeleton";

const TopbarSkeleton = () => {
	return (
		<div className="flex items-center justify-between gap-2 bg-black/45 p-4 px-8 backdrop-blur-xl">
			{/* BACK BUTTON AND TITLE */}
			<div className="flex flex-col items-start gap-2">
				<Skeleton className="h-5 w-16" /> {/* Back button */}
				<Skeleton className="h-8 w-48" /> {/* Title */}
			</div>

			{/* ADD TO LIST BUTTON */}
			<Skeleton className="h-10 w-36 rounded-md" />
		</div>
	);
};

export default TopbarSkeleton;
