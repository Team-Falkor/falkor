import { create } from "zustand";
import type { GameFileMatchResult } from "../types";

type ManualGameSelectionState = {
	// Games that need manual selection
	gamesNeedingManualSelection: GameFileMatchResult[];
	// Current game being processed
	currentGameIndex: number;
	// Whether the manual selection step is completed
	hasCompletedManualSelection: boolean;
	// Whether manual selection is required
	requiresManualSelection: boolean;
};

type ManualGameSelectionActions = {
	// Set games that need manual selection
	setGamesNeedingManualSelection: (games: GameFileMatchResult[]) => void;
	// Move to the next game
	moveToNextGame: () => void;
	// Move to the previous game
	moveToPreviousGame: () => void;
	// Check if there are more games to process
	hasMoreGames: () => boolean;
	// Get the current game
	getCurrentGame: () => GameFileMatchResult | undefined;
	// Set completion status
	setHasCompletedManualSelection: (hasCompleted: boolean) => void;
	// Reset the store
	reset: () => void;
};

type ManualGameSelectionStore = ManualGameSelectionState &
	ManualGameSelectionActions;

const initialState: ManualGameSelectionState = {
	gamesNeedingManualSelection: [],
	currentGameIndex: 0,
	hasCompletedManualSelection: false,
	requiresManualSelection: false,
};

export const useManualGameSelectionStore = create<ManualGameSelectionStore>(
	(set, get) => ({
		...initialState,

		setGamesNeedingManualSelection: (games) => {
			const hasGames = games.length > 0;
			set({
				gamesNeedingManualSelection: games,
				currentGameIndex: hasGames ? 0 : -1,
				hasCompletedManualSelection: !hasGames,
				requiresManualSelection: hasGames,
			});
		},

		moveToNextGame: () => {
			const { currentGameIndex, gamesNeedingManualSelection } = get();
			const nextIndex = currentGameIndex + 1;

			if (nextIndex < gamesNeedingManualSelection.length) {
				set({ currentGameIndex: nextIndex });
			} else {
				// All games processed
				set({ hasCompletedManualSelection: true });
			}
		},

		moveToPreviousGame: () => {
			const { currentGameIndex } = get();
			if (currentGameIndex > 0) {
				set({ currentGameIndex: currentGameIndex - 1 });
			}
		},

		hasMoreGames: () => {
			const { currentGameIndex, gamesNeedingManualSelection } = get();
			return currentGameIndex < gamesNeedingManualSelection.length - 1;
		},

		getCurrentGame: () => {
			const { currentGameIndex, gamesNeedingManualSelection } = get();
			return gamesNeedingManualSelection[currentGameIndex];
		},

		setHasCompletedManualSelection: (hasCompleted) => {
			set({ hasCompletedManualSelection: hasCompleted });
		},

		reset: () => set(initialState),
	}),
);
