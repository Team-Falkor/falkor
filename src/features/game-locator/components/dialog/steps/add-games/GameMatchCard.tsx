import { Calendar, Check, Plus, Star, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { RouterOutputs } from "@/@types";
import IGDBImage from "@/components/IGDBImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TypographyMuted } from "@/components/ui/typography";
import { trpc } from "@/lib";
import { cn } from "@/lib/utils";

type GameMatchResult = {
	game: RouterOutputs["igdb"]["search"][number];
	confidence: number;
	reason: string;
};

interface GameMatchCardProps {
	match: GameMatchResult;
	isBestMatch: boolean;
	onGameAdded?: (gameId: string) => void;
	isAddedExternally?: boolean;
	filePath?: string; // Add file path prop
}

export const GameMatchCard = ({
	match,
	isBestMatch,
	onGameAdded,
	isAddedExternally = false,
	filePath,
}: GameMatchCardProps) => {
	const [isAdded, setIsAdded] = useState(isAddedExternally);
	const utils = trpc.useUtils();

	// Update isAdded state when isAddedExternally changes
	useEffect(() => {
		if (isAddedExternally) {
			setIsAdded(true);
		}
	}, [isAddedExternally]);

	const { mutate: createGame, isPending: isCreating } =
		trpc.library.create.useMutation({
			onSuccess: async (data) => {
				if (!data) {
					toast.error("Error creating game");
					return;
				}

				setIsAdded(true);
				onGameAdded?.(data.gameId);

				await utils.library.invalidate(undefined, {
					refetchType: "all",
					type: "all",
				});

				toast.success(`${match.game.name} added to library!`);
			},
			onError: (error) => {
				toast.error("Error adding game to library", {
					description: error.message,
				});
			},
		});

	const getConfidenceBadgeVariant = (confidence: number) => {
		if (confidence >= 0.8) return "default";
		if (confidence >= 0.6) return "secondary";
		return "destructive";
	};

	return (
		<Card
			className={cn("group transition-all duration-200 hover:shadow-md", {
				"border-primary bg-primary/5": isBestMatch,
			})}
		>
			<CardContent className="p-4">
				<div className="flex gap-4">
					{/* Game Cover */}
					<div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
						{match.game.cover?.image_id ? (
							<IGDBImage
								imageId={match.game.cover.image_id}
								alt={match.game.name}
								className="h-full w-full object-cover"
							/>
						) : (
							<div className="flex h-full w-full items-center justify-center text-muted-foreground">
								No Image
							</div>
						)}
					</div>

					{/* Game Details */}
					<div className="min-w-0 flex-1 space-y-2">
						{/* Header */}
						<div className="flex items-start justify-between gap-2">
							<h3 className="line-clamp-2 font-semibold text-sm leading-tight">
								{match.game.name}
							</h3>
							<div className="flex shrink-0 gap-2">
								{isBestMatch && (
									<Badge variant="default" className="text-xs">
										Best
									</Badge>
								)}
								<Badge
									variant={getConfidenceBadgeVariant(match.confidence)}
									className="text-xs"
								>
									{Math.round(match.confidence * 100)}%
								</Badge>
							</div>
						</div>

						{/* Metadata */}
						<div className="flex flex-wrap items-center gap-3 text-muted-foreground text-xs">
							{match.game.first_release_date && (
								<div className="flex items-center gap-1">
									<Calendar className="h-3 w-3" />
									<span>
										{new Date(
											match.game.first_release_date * 1000,
										).getFullYear()}
									</span>
								</div>
							)}

							{match.game.total_rating && (
								<div className="flex items-center gap-1">
									<Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
									<span>{Math.round(match.game.total_rating / 10)}/10</span>
								</div>
							)}

							{match.game.platforms && match.game.platforms.length > 0 && (
								<div className="flex items-center gap-1">
									<Users className="h-3 w-3" />
									<span>{match.game.platforms.length}</span>
								</div>
							)}
						</div>

						{/* Summary */}
						{match.game.summary && (
							<TypographyMuted className="line-clamp-2 text-xs leading-relaxed">
								{match.game.summary}
							</TypographyMuted>
						)}

						{/* Actions */}
						<div className="flex gap-2 pt-1">
							<Button
								variant={isAdded ? "secondary" : "default"}
								size="sm"
								className="h-7 text-xs"
								disabled={isAdded || isCreating}
								onClick={() => {
									if (!isAdded) {
										// Create game from IGDB data
										const gameIcon = match.game.cover?.image_id
											? `https://images.igdb.com/igdb/image/upload/t_cover_big/${match.game.cover.image_id}.jpg`
											: undefined;

										createGame({
											gameName: match.game.name,
											gamePath: filePath || "",
											igdbId: match.game.id,
											gameIcon,
											installed: !!filePath,
										});
									}
								}}
							>
								{isCreating ? (
									<>
										<div className="mr-1 h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
										Adding...
									</>
								) : isAdded ? (
									<>
										<Check className="mr-1 h-3 w-3" />
										Added
									</>
								) : (
									<>
										<Plus className="mr-1 h-3 w-3" />
										Add to Library
									</>
								)}
							</Button>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};
