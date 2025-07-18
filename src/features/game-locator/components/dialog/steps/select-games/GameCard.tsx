import { Check, Plus } from "lucide-react";
import { memo, useCallback, useMemo } from "react";
import type { FileInfo } from "@/@types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { bytesToHumanReadable, cn } from "@/lib/utils";

const GameDetails = memo(
	({ game, formattedSize }: { game: FileInfo; formattedSize: string }) => (
		<div className="min-w-0 flex-1">
			<h3 className="mb-1 truncate font-semibold text-sm leading-tight">
				{game.name}
			</h3>
			<p className="mb-2 line-clamp-2 text-muted-foreground text-xs">
				{game.path}
			</p>
			<div className="flex flex-wrap gap-2">
				{game.size && (
					<Badge variant="outline" className="px-2 py-0.5 text-xs">
						{formattedSize}
					</Badge>
				)}
			</div>
		</div>
	),
);

interface GameCardProps {
	game: FileInfo;
	isSelected: boolean;
	onToggleSelection: (game: FileInfo) => void;
	showSelectionControls?: boolean;
}

export const GameCard = memo(
	({
		game,
		isSelected,
		onToggleSelection,
		showSelectionControls = true,
	}: GameCardProps) => {
		// Memoize expensive calculations
		const formattedSize = useMemo(
			() => bytesToHumanReadable(game.size ?? 0),
			[game.size],
		);

		// Memoize click handlers
		const handleCardClick = useCallback(() => {
			if (showSelectionControls) {
				onToggleSelection(game);
			}
		}, [showSelectionControls, onToggleSelection, game]);

		const handleButtonClick = useCallback(
			(e: React.MouseEvent) => {
				e.stopPropagation();
				onToggleSelection(game);
			},
			[onToggleSelection, game],
		);

		return (
			<Card
				className={cn(
					"group relative h-full cursor-pointer p-0 transition-all duration-200 focus-states:shadow-lg",
					isSelected
						? "border-primary bg-primary/10 shadow-md"
						: "focus-states:border-muted-foreground/30",
				)}
				onClick={handleCardClick}
			>
				<CardContent className="flex h-full flex-col p-4">
					<div className="flex flex-1 items-start justify-between gap-4">
						<div className="flex min-w-0 flex-1 items-start gap-4">
							<GameDetails game={game} formattedSize={formattedSize} />
						</div>

						{/* Selection Button */}
						{showSelectionControls && (
							<Button
								variant={isSelected ? "default" : "outline"}
								size="icon"
								className={cn(
									"h-8 w-8 shrink-0 transition-all duration-200",
									isSelected
										? "bg-primary text-primary-foreground focus-states:bg-primary/90"
										: "opacity-50 group-focus-states:opacity-100",
								)}
								onClick={handleButtonClick}
							>
								{isSelected ? (
									<Check className="h-4 w-4" />
								) : (
									<Plus className="h-4 w-4" />
								)}
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
		);
	},
);
