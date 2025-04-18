import { Skeleton } from "@/components/ui/skeleton";

const TopbarSkeleton = () => {
  return (
    <div className="flex items-center justify-between gap-2 p-4 px-8 bg-black/45 backdrop-blur-xl">
      {/* BACK BUTTON AND TITLE */}
      <div className="flex flex-col items-start gap-2">
        <Skeleton className="w-16 h-5" /> {/* Back button */}
        <Skeleton className="w-48 h-8" /> {/* Title */}
      </div>

      {/* ADD TO LIST BUTTON */}
      <Skeleton className="h-10 rounded-md w-36" />
    </div>
  );
};

export default TopbarSkeleton;
