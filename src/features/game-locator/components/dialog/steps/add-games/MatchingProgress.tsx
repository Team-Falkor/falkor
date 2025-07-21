import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { P, TypographyMuted } from "@/components/ui/typography";

interface MatchingProgressProps {
	progress: number;
	totalGames: number;
	currentFile?: string;
}

export const MatchingProgress = ({
	progress,
	totalGames,
	currentFile,
}: MatchingProgressProps) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Loader2 className="h-5 w-5 animate-spin" />
					Finding Matches...
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<div className="flex justify-between text-sm">
						<span>Progress</span>
						<span>{Math.round(progress)}%</span>
					</div>
					<Progress value={progress} className="w-full" />
				</div>

				<div className="space-y-1 text-center">
					<P>
						Searching for matches for {totalGames} game
						{totalGames !== 1 ? "s" : ""}...
					</P>
					{currentFile && (
						<TypographyMuted className="text-xs">
							Currently processing: {currentFile}
						</TypographyMuted>
					)}
				</div>
			</CardContent>
		</Card>
	);
};
