import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
	message?: string;
	showSkeletons?: boolean;
	skeletonCount?: number;
	className?: string;
}

export const LoadingState = ({
	message = "Loading games...",
	showSkeletons = true,
	skeletonCount = 6,
	className,
}: LoadingStateProps) => {
	if (!showSkeletons) {
		return (
			<Card className={cn("border-dashed", className)}>
				<CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
					<Loader2 className="mb-4 h-8 w-8 animate-spin text-muted-foreground" />
					<p className="text-muted-foreground text-sm">{message}</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className={cn("space-y-4", className)}>
			{/* Loading Header */}
			<div className="mb-6 flex items-center gap-2">
				<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
				<span className="text-muted-foreground text-sm">{message}</span>
			</div>

			{/* Skeleton Cards */}
			<div className="grid gap-4">
				{Array.from({ length: skeletonCount }).map((_, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: its a skeli its fine
					<Card key={index} className="animate-pulse">
						<CardContent className="p-4">
							<div className="flex items-start justify-between gap-3">
								<div className="flex flex-1 items-start gap-3">
									{/* Icon Skeleton */}
									<Skeleton className="h-12 w-12 rounded-lg" />

									{/* Content Skeleton */}
									<div className="flex-1 space-y-2">
										<Skeleton className="h-4 w-3/4" />
										<Skeleton className="h-3 w-full" />
										<div className="mt-2 flex gap-2">
											<Skeleton className="h-5 w-16 rounded-full" />
											<Skeleton className="h-5 w-20 rounded-full" />
											<Skeleton className="h-5 w-24 rounded-full" />
										</div>
									</div>
								</div>

								{/* Button Skeleton */}
								<Skeleton className="h-8 w-8 rounded-lg" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
};
