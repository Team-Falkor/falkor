import { Skeleton } from "@/components/ui/skeleton";

const InfoTopSkeleton = () => {
	return (
		<div className="flex h-[32rem] overflow-hidden">
			{/* BACKGROUND */}
			<div className="absolute inset-0 z-0 h-[38rem] w-full overflow-hidden bg-center bg-cover bg-no-repeat">
				<Skeleton className="relative z-0 h-full w-full blur-md" />
				<span className="absolute inset-0 bg-linear-to-t from-background to-transparent" />
			</div>

			<div className="relative z-10 mb-5 flex w-full items-start justify-between gap-6">
				{/* CAROUSEL */}
				<div className="w2/6 h-full overflow-hidden rounded-2xl xl:w-[36%]">
					<Skeleton className="size-full" />
				</div>

				{/* INFO SECTION (RIGHT) */}
				<div className="flex h-full flex-1 flex-col justify-start gap-5 overflow-hidden">
					{/* TAB SELECTOR */}
					<div className="flex gap-4">
						<Skeleton className="h-8 w-32 rounded-full" />
						<Skeleton className="h-8 w-48 rounded-full" />
					</div>

					{/* DETAILS SECTION */}
					<div className="flex w-full flex-col gap-2 overflow-hidden rounded-2xl bg-background p-4">
						<div className="flex h-10 items-center justify-between overflow-hidden">
							<Skeleton className="h-8 w-32 rounded-full" />
							<div className="flex flex-1 items-center justify-end gap-7">
								<Skeleton className="h-8 w-20 rounded-full" />
								<Skeleton className="h-8 w-24 rounded-full" />
							</div>
						</div>

						<div className="flex items-start justify-between gap-2">
							<div className="flex items-center gap-1.5">
								<Skeleton className="h-8 w-28 rounded-full" />
								<Skeleton className="h-8 w-28 rounded-full" />
							</div>
							<div className="flex items-center gap-1.5">
								<Skeleton className="h-8 w-20 rounded-full" />
								<Skeleton className="h-8 w-24 rounded-full" />
							</div>
						</div>

						<Skeleton className="h-16 w-full rounded-md" />
					</div>

					<div>
						<Skeleton className="h-10 w-full rounded-md" />
					</div>
				</div>
			</div>
		</div>
	);
};

export default InfoTopSkeleton;
