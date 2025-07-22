import { ChevronDown, ChevronRight, Plus, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { RouterOutputs } from "@/@types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { H4, P, TypographyMuted } from "@/components/ui/typography";
import { trpc } from "@/lib";
import { cn } from "@/lib/utils";
import { GameMatchCard } from "./GameMatchCard";

type GameFileMatchResult = {
	file: {
		name: string;
		path: string;
		isDirectory: boolean;
		size?: number;
		lastModified?: string;
	};
	matches: {
		game: RouterOutputs["igdb"]["search"][number];
		confidence: number;
		reason: string;
	}[];
	bestMatch: {
		game: RouterOutputs["igdb"]["search"][number];
		confidence: number;
		reason: string;
	} | null;
};

interface MatchResultsProps {
	results: GameFileMatchResult[];
}

export const MatchResults = ({ results }: MatchResultsProps) => {
	const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
	const [isAddingAll, setIsAddingAll] = useState(false);
	const [addedGameIds, setAddedGameIds] = useState<Set<number>>(new Set());
	const utils = trpc.useUtils();

	const toggleExpanded = (filePath: string) => {
		setExpandedItems((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(filePath)) {
				newSet.delete(filePath);
			} else {
				newSet.add(filePath);
			}
			return newSet;
		});
	};

	const getConfidenceBadgeVariant = (confidence: number) => {
		if (confidence >= 0.8) return "default";
		if (confidence >= 0.6) return "secondary";
		return "destructive";
	};

	const { mutate: createManyGames } = trpc.library.createMany.useMutation({
		onSuccess: async (data) => {
			if (!data || data.length === 0) {
				toast.error("Error adding games to library");
				return;
			}

			setIsAddingAll(false);

			// Track which games have been added
			const newAddedGameIds = new Set(addedGameIds);
			data.forEach((game) => {
				if (game.igdbId) {
					newAddedGameIds.add(game.igdbId);
				}
			});
			setAddedGameIds(newAddedGameIds);

			await utils.library.invalidate(undefined, {
				refetchType: "all",
				type: "all",
			});

			toast.success(`${data.length} games added to library!`);
		},
		onError: (error) => {
			setIsAddingAll(false);
			toast.error("Error adding games to library", {
				description: error.message,
			});
		},
	});

	const handleAddAllGames = () => {
		const gamesToAdd = results
			.filter((result) => result.bestMatch !== null)
			.map((result) => {
				const bestMatch = result.bestMatch;
				if (!bestMatch) return null;
				const gameIcon = bestMatch.game.cover?.image_id
					? `https://images.igdb.com/igdb/image/upload/t_cover_big/${bestMatch.game.cover.image_id}.jpg`
					: undefined;

				return {
					gameName: bestMatch.game.name,
					gamePath: result.file.path, // Use the file path from the match result
					igdbId: bestMatch.game.id,
					gameIcon,
					installed: true, // Mark as installed since we have a path
				};
			});

		if (gamesToAdd.length === 0) {
			toast.error("No games with matches to add");
			return;
		}

		setIsAddingAll(true);
		createManyGames({ games: gamesToAdd?.filter((game) => game !== null) });
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<H4>Detailed Results</H4>
				<Button
					variant="default"
					size="sm"
					className="flex items-center gap-1"
					onClick={handleAddAllGames}
					disabled={isAddingAll || results.every((r) => r.bestMatch === null)}
				>
					{isAddingAll ? (
						<>
							<div className="mr-1 h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
							Adding All...
						</>
					) : (
						<>
							<Plus className="h-3 w-3" />
							Add All Games
						</>
					)}
				</Button>
			</div>

			{results.map((result) => {
				const isExpanded = expandedItems.has(result.file.path);
				const hasMatches = result.matches.length > 0;
				const bestMatch = result.bestMatch;

				return (
					<Card
						key={result.file.path}
						className={cn(
							"overflow-hidden py-0 transition-all duration-200",
							hasMatches ? "border-green-200" : "border-red-200",
						)}
					>
						<Collapsible
							open={isExpanded}
							onOpenChange={() => toggleExpanded(result.file.path)}
						>
							<CollapsibleTrigger asChild>
								<CardHeader className=" cursor-pointer py-2 transition-colors hover:bg-muted/50">
									<CardTitle className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											{isExpanded ? (
												<ChevronDown className="h-4 w-4" />
											) : (
												<ChevronRight className="h-4 w-4" />
											)}
											<div className="text-left">
												<div className="font-medium">{result.file.name}</div>
												<TypographyMuted className="font-normal text-xs">
													{result.file.path}
												</TypographyMuted>
											</div>
										</div>

										<div className="flex items-center gap-2">
											{hasMatches ? (
												<>
													<Badge variant="outline" className="text-green-700">
														{result.matches.length} match
														{result.matches.length !== 1 ? "es" : ""}
													</Badge>
													{bestMatch && (
														<Badge
															variant={getConfidenceBadgeVariant(
																bestMatch.confidence,
															)}
															className="flex items-center gap-1"
														>
															<Star className="h-3 w-3" />
															{Math.round(bestMatch.confidence * 100)}%
														</Badge>
													)}
												</>
											) : (
												<Badge variant="destructive">No matches</Badge>
											)}
										</div>
									</CardTitle>
								</CardHeader>
							</CollapsibleTrigger>

							<CollapsibleContent>
								<CardContent className="pt-0">
									{hasMatches ? (
										<div className="space-y-3">
											{bestMatch && (
												<div className="mb-4">
													<P className="mb-2 font-medium text-green-700 text-sm">
														Best Match:
													</P>
													<GameMatchCard
														match={bestMatch}
														isBestMatch={true}
														isAddedExternally={addedGameIds.has(
															bestMatch.game.id,
														)}
														filePath={result.file.path}
														onGameAdded={() => {
															setAddedGameIds((prev) => {
																const newSet = new Set(prev);
																newSet.add(bestMatch.game.id);
																return newSet;
															});
														}}
													/>
												</div>
											)}

											{result.matches.length > 1 && (
												<div>
													<P className="mb-2 font-medium text-sm">
														Other Matches:
													</P>
													<div className="space-y-2">
														{result.matches
															.filter(
																(match) => match.game.id !== bestMatch?.game.id,
															)
															.map((match) => (
																<GameMatchCard
																	key={match.game.id}
																	match={match}
																	isBestMatch={false}
																	isAddedExternally={addedGameIds.has(
																		match.game.id,
																	)}
																	filePath={result.file.path}
																	onGameAdded={() => {
																		setAddedGameIds((prev) => {
																			const newSet = new Set(prev);
																			newSet.add(match.game.id);
																			return newSet;
																		});
																	}}
																/>
															))}
													</div>
												</div>
											)}
										</div>
									) : (
										<div className="py-8 text-center">
											<TypographyMuted>
												No matches found for this game. You may need to manually
												search or add it.
											</TypographyMuted>
										</div>
									)}
								</CardContent>
							</CollapsibleContent>
						</Collapsible>
					</Card>
				);
			})}
		</div>
	);
};
