import { AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { H2, TypographyMuted } from "@/components/ui/typography";
import { useManualGameSelectionStore } from "@/features/game-locator/stores/manualGameSelection";
import { ManualGameSelectionForm } from "./ManualGameSelectionForm";

export const GameLocatorManualSelectionStep = () => {
	const {
		gamesNeedingManualSelection,
		currentGameIndex,
		getCurrentGame,
		setHasCompletedManualSelection,
	} = useManualGameSelectionStore();

	// Update completion state based on whether there are games to process
	useEffect(() => {
		const hasGames = gamesNeedingManualSelection.length > 0;
		const allProcessed = currentGameIndex >= gamesNeedingManualSelection.length;

		// If there are no games or all games have been processed, mark as completed
		setHasCompletedManualSelection(!hasGames || allProcessed);
	}, [
		gamesNeedingManualSelection.length,
		currentGameIndex,
		setHasCompletedManualSelection,
	]);

	// If there are no games that need manual selection
	if (gamesNeedingManualSelection.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
				<H2 className="mb-2">No Manual Selection Needed</H2>
				<TypographyMuted>
					All games have been automatically matched or there are no games to
					process.
				</TypographyMuted>
			</div>
		);
	}

	// If we've processed all games
	if (currentGameIndex >= gamesNeedingManualSelection.length) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<H2 className="mb-2">All Games Processed</H2>
				<TypographyMuted>
					You have completed manual selection for all games.
				</TypographyMuted>
			</div>
		);
	}

	// Get the current game to process
	const currentGame = getCurrentGame();

	if (!currentGame) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
				<H2 className="mb-2">Error</H2>
				<TypographyMuted>
					Could not find the current game to process.
				</TypographyMuted>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="text-center">
				<H2 className="mb-2">Manual Game Selection</H2>
				<TypographyMuted>
					Game {currentGameIndex + 1} of {gamesNeedingManualSelection.length}:{" "}
					{currentGame.file.name}
				</TypographyMuted>
			</div>

			<ManualGameSelectionForm currentGame={currentGame} />
		</div>
	);
};
