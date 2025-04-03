import { Skeleton } from "@/components/ui/skeleton";

const InfoTopSkeleton = () => {
  return (
    <div className="flex h-[32rem] overflow-hidden">
      {/* BACKGROUND */}
      <div className="absolute w-full  h-[38rem] z-0 bg-cover bg-center bg-no-repeat inset-0 overflow-hidden">
        <Skeleton className="relative z-0 w-full h-full blur-md" />
        <span className="absolute inset-0 bg-linear-to-t from-background to-transparent" />
      </div>

      <div className="relative z-10 flex items-start justify-between w-full gap-6 mb-5">
        {/* CAROUSEL */}
        <div className="xl:w-[36%] w2/6 h-full overflow-hidden rounded-2xl">
          <Skeleton className="size-full" />
        </div>

        {/* INFO SECTION (RIGHT) */}
        <div className="flex flex-col justify-start flex-1 h-full gap-5 overflow-hidden">
          {/* TAB SELECTOR */}
          <div className="flex gap-4">
            <Skeleton className="w-32 h-8 rounded-full" />
            <Skeleton className="w-48 h-8 rounded-full" />
          </div>

          {/* DETAILS SECTION */}
          <div className="flex flex-col w-full gap-2 p-4 overflow-hidden rounded-2xl bg-background">
            <div className="flex items-center justify-between h-10 overflow-hidden">
              <Skeleton className="w-32 h-8 rounded-full" />
              <div className="flex items-center justify-end flex-1 gap-7">
                <Skeleton className="w-20 h-8 rounded-full" />
                <Skeleton className="w-24 h-8 rounded-full" />
              </div>
            </div>

            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-8 rounded-full w-28" />
                <Skeleton className="h-8 rounded-full w-28" />
              </div>
              <div className="flex items-center gap-1.5">
                <Skeleton className="w-20 h-8 rounded-full" />
                <Skeleton className="w-24 h-8 rounded-full" />
              </div>
            </div>

            <Skeleton className="w-full h-16 rounded-md" />
          </div>

          <div>
            <Skeleton className="w-full h-10 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoTopSkeleton;
