import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import type { RouterOutputs } from "@/@types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { H3, TypographyMuted } from "@/components/ui/typography";

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

interface MatchingSummaryProps {
	results: GameFileMatchResult[];
}

export const MatchingSummary = ({ results }: MatchingSummaryProps) => {
	const totalGames = results.length;
	const gamesWithMatches = results.filter(
		(result) => result.matches.length > 0,
	).length;
	const gamesWithBestMatch = results.filter(
		(result) => result.bestMatch !== null,
	).length;
	const gamesWithoutMatches = totalGames - gamesWithMatches;

	const getStatusIcon = () => {
		if (gamesWithoutMatches === 0) {
			return <CheckCircle className="h-5 w-5 text-green-500" />;
		}
		if (gamesWithMatches > 0) {
			return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
		}
		return <XCircle className="h-5 w-5 text-red-500" />;
	};

	const getStatusText = () => {
		if (gamesWithoutMatches === 0) {
			return "All games matched successfully!";
		}
		if (gamesWithMatches > 0) {
			return "Partial matches found";
		}
		return "No matches found";
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					{getStatusIcon()}
					Matching Results Summary
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					<H3>{getStatusText()}</H3>

					<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
						<div className="space-y-1 text-center">
							<div className="font-bold text-2xl">{totalGames}</div>
							<TypographyMuted className="text-xs">Total Games</TypographyMuted>
						</div>

						<div className="space-y-1 text-center">
							<div className="font-bold text-2xl text-green-600">
								{gamesWithMatches}
							</div>
							<TypographyMuted className="text-xs">
								With Matches
							</TypographyMuted>
						</div>

						<div className="space-y-1 text-center">
							<div className="font-bold text-2xl text-blue-600">
								{gamesWithBestMatch}
							</div>
							<TypographyMuted className="text-xs">
								Best Matches
							</TypographyMuted>
						</div>

						<div className="space-y-1 text-center">
							<div className="font-bold text-2xl text-red-600">
								{gamesWithoutMatches}
							</div>
							<TypographyMuted className="text-xs">No Matches</TypographyMuted>
						</div>
					</div>

					{gamesWithMatches > 0 && (
						<div className="flex flex-wrap gap-2">
							<Badge
								variant="secondary"
								className="bg-green-100 text-green-700"
							>
								{gamesWithMatches} games with matches
							</Badge>
							{gamesWithBestMatch > 0 && (
								<Badge
									variant="secondary"
									className="bg-blue-100 text-blue-700"
								>
									{gamesWithBestMatch} confident matches
								</Badge>
							)}
							{gamesWithoutMatches > 0 && (
								<Badge variant="secondary" className="bg-red-100 text-red-700">
									{gamesWithoutMatches} unmatched
								</Badge>
							)}
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
};
