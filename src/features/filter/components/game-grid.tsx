import { format } from "date-fns";
import type { RouterOutputs } from "@/@types";
import DefaultCard from "@/components/cards/defaultCard";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface GameGridProps {
	games?: RouterOutputs["igdb"]["filter"];
	isLoading: boolean;
}

export function GameGrid({ games, isLoading }: GameGridProps) {
	const gridContainerClasses =
		"grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 p-4";

	if (isLoading) {
		return (
			<div className={gridContainerClasses}>
				{Array.from({ length: 15 }).map((_, idx) => (
					<Card
						// biome-ignore lint/suspicious/noArrayIndexKey: Fine for skeleton
						key={idx}
						className="aspect-[3/4] animate-pulse overflow-hidden p-0"
					>
						<Skeleton className="h-full w-full" />
					</Card>
				))}
			</div>
		);
	}

	if (!games || games.length === 0) {
		return (
			<div className="flex h-[60vh] items-center justify-center p-4">
				<p className="text-center text-lg text-muted-foreground">
					No games found. Try adjusting your filters!
				</p>
			</div>
		);
	}

	return (
		<div className={gridContainerClasses}>
			{games.map((game) => (
				<DefaultCard
					key={game.id}
					{...game}
					cover={{
						image: game.cover?.image_id,
						type: "image_id",
					}}
					renderBottomOfImage={() => {
						if (!game.first_release_date) return null;

						// Show release date in badge use date fns to format
						return (
							<Badge className="bg-muted/30 backdrop-blur-3xl">
								<span className="text-sm">
									{format(new Date(game.first_release_date * 1000), "PPP")}
								</span>
							</Badge>
						);
					}}
				/>
			))}
		</div>
	);
}
