import { AlertCircle, Loader2, Search } from "lucide-react";
import { useState } from "react";
import type { RouterOutputs } from "@/@types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { H2, P, TypographyMuted } from "@/components/ui/typography";
import { useGameLocatorStore } from "@/features/game-locator/stores/gameLocator";
import { trpc } from "@/lib/trpc";
import { MatchingProgress } from "./MatchingProgress";
import { MatchingSummary } from "./MatchingSummary";
import { MatchResults } from "./MatchResults";

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

interface MatchingState {
	status: "idle" | "matching" | "completed" | "error";
	progress: number;
	currentFile?: string;
	results: GameFileMatchResult[];
	errorMessage?: string;
}

export const GameLocatorAddGamesStep = () => {
	const { selectedGames, setHasCompletedAddGames } = useGameLocatorStore();
	const [matchingState, setMatchingState] = useState<MatchingState>({
		status: "idle",
		progress: 0,
		results: [],
	});

	const findMatchesMutation = trpc.gameMatcher.findMatchesForFiles.useMutation({
		onSuccess: (response) => {
			if (response.success && "data" in response) {
				setMatchingState((prev) => ({
					...prev,
					status: "completed",
					progress: 100,
					results: response.data,
				}));
				// Mark this step as completed when matching is successful
				setHasCompletedAddGames(true);
			} else {
				setMatchingState((prev) => ({
					...prev,
					status: "error",
					errorMessage:
						"error" in response ? response.error : "Unknown error occurred",
				}));
				// Reset completion state on error
				setHasCompletedAddGames(false);
			}
		},
		onError: (error) => {
			setMatchingState((prev) => ({
				...prev,
				status: "error",
				errorMessage: error.message,
			}));
			// Reset completion state on error
			setHasCompletedAddGames(false);
		},
	});

	const handleStartMatching = async () => {
		if (selectedGames.length === 0) return;

		setMatchingState({
			status: "matching",
			progress: 0,
			results: [],
		});

		// Simulate progress updates
		const progressInterval = setInterval(() => {
			setMatchingState((prev) => {
				if (prev.status === "matching" && prev.progress < 90) {
					return {
						...prev,
						progress: prev.progress + 10,
					};
				}
				return prev;
			});
		}, 500);

		try {
			await findMatchesMutation.mutateAsync({
				gameFiles: selectedGames,
				options: {
					minConfidence: 0.6,
					maxResults: 5,
					includeAlternativeNames: true,
				},
			});
		} finally {
			clearInterval(progressInterval);
		}
	};

	const handleRetry = () => {
		setMatchingState({
			status: "idle",
			progress: 0,
			results: [],
		});
		// Reset completion state when retrying
		setHasCompletedAddGames(false);
	};

	if (selectedGames.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
				<H2 className="mb-2">No Games Selected</H2>
				<TypographyMuted>
					Please go back and select some games to find matches for.
				</TypographyMuted>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="text-center">
				<H2 className="mb-2">Find Game Matches</H2>
				<TypographyMuted>
					We'll search for matches for your {selectedGames.length} selected game
					{selectedGames.length !== 1 ? "s" : ""}
				</TypographyMuted>
			</div>

			{matchingState.status === "idle" && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Search className="h-5 w-5" />
							Ready to Find Matches
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<P>
							Click the button below to start finding matches for your selected
							games.
						</P>
						<Button
							onClick={handleStartMatching}
							size="lg"
							className="w-full"
							disabled={findMatchesMutation.isPending}
						>
							{findMatchesMutation.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Finding Matches...
								</>
							) : (
								<>
									<Search className="mr-2 h-4 w-4" />
									Find Matches
								</>
							)}
						</Button>
					</CardContent>
				</Card>
			)}

			{matchingState.status === "matching" && (
				<MatchingProgress
					progress={matchingState.progress}
					totalGames={selectedGames.length}
					currentFile={matchingState.currentFile}
				/>
			)}

			{matchingState.status === "completed" && (
				<>
					<MatchingSummary results={matchingState.results} />
					<MatchResults results={matchingState.results} />
				</>
			)}

			{matchingState.status === "error" && (
				<Card className="border-destructive">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-destructive">
							<AlertCircle className="h-5 w-5" />
							Error Finding Matches
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<P className="text-destructive">{matchingState.errorMessage}</P>
						<Button onClick={handleRetry} variant="outline">
							Try Again
						</Button>
					</CardContent>
				</Card>
			)}
		</div>
	);
};
