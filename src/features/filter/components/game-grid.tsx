import type { RouterOutputs } from "@/@types";
import DefaultCard from "@/components/cards/defaultCard";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface GameGridProps {
	games?: RouterOutputs["igdb"]["filter"];
	isLoading: boolean;
}

export function GameGrid({ games, isLoading }: GameGridProps) {
	// Flex layout: items wrap and use responsive percentage widths
	const containerClasses = "flex flex-wrap gap-4 p-4 justify-start";
	const itemClasses = "w-full ";

	if (isLoading) {
		return (
			<div className={containerClasses}>
				{Array.from({ length: 15 }).map((_, idx) => (
					<Card
						key={idx}
						className={`${itemClasses} aspect-[3/4] animate-pulse overflow-hidden p-0`}
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
		<div className={containerClasses}>
			{games.map((game) => (
				<DefaultCard {...game} />
			))}
		</div>
	);
}
