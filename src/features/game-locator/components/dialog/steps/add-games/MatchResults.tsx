import { ChevronDown, ChevronRight, Star } from "lucide-react";
import { useState } from "react";
import type { RouterOutputs } from "@/@types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { H4, P, TypographyMuted } from "@/components/ui/typography";
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

type MatchingResults = GameFileMatchResult[];

interface MatchResultsProps {
	results: GameFileMatchResult[];
}

export const MatchResults = ({ results }: MatchResultsProps) => {
	const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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

	const getConfidenceColor = (confidence: number) => {
		if (confidence >= 0.8) return "text-green-600";
		if (confidence >= 0.6) return "text-yellow-600";
		return "text-red-600";
	};

	const getConfidenceBadgeVariant = (confidence: number) => {
		if (confidence >= 0.8) return "default";
		if (confidence >= 0.6) return "secondary";
		return "destructive";
	};

	return (
		<div className="space-y-4">
			<H4>Detailed Results</H4>

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
													<GameMatchCard match={bestMatch} isBestMatch={true} />
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
