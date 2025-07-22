import { create } from "zustand";
import type { FileInfo } from "@/@types";

type GameLocatorStoreState = {
	hasCompletedScanFolders: boolean;
	hasCompletedSelectGames: boolean;
	hasCompletedAddGames: boolean;

	// All discovered games from scan results (persistent for reuse)
	games: FileInfo[];
	// Games selected by user to be added to their library
	selectedGames: FileInfo[];
};

type GameLocatorStoreActions = {
	// Game management
	setGames: (games: FileInfo[]) => void;
	addGame: (game: FileInfo) => void;
	removeGame: (gamePath: string) => void;
	clearGames: () => void;

	// Game selection for adding to library
	toggleGameSelection: (game: FileInfo) => void;
	setSelectedGames: (games: FileInfo[]) => void;
	clearSelectedGames: () => void;
	selectAllGames: () => void;
	isGameSelected: (gamePath: string) => boolean;

	// Step states
	setHasCompletedScanFolders: (hasCompleted: boolean) => void;
	setHasCompletedSelectGames: (hasCompleted: boolean) => void;
	setHasCompletedAddGames: (hasCompleted: boolean) => void;

	// Reset all states
	reset: () => void;
};

type GameLocatorStore = GameLocatorStoreState & GameLocatorStoreActions;

const initialState: GameLocatorStoreState = {
	hasCompletedScanFolders: false,
	hasCompletedSelectGames: false,
	hasCompletedAddGames: false,
	games: [],
	selectedGames: [],
};

export const useGameLocatorStore = create<GameLocatorStore>((set, get) => ({
	...initialState,

	// Game management
	setGames: (games) => set({ games }),

	addGame: (game) => {
		const { games } = get();
		// Avoid duplicates based on path
		if (!games.some((g) => g.path === game.path)) {
			set({ games: [...games, game] });
		}
	},

	removeGame: (gamePath) => {
		const { games, selectedGames } = get();
		set({
			games: games.filter((g) => g.path !== gamePath),
			// Also remove from selected if it was selected
			selectedGames: selectedGames.filter((g) => g.path !== gamePath),
		});
	},

	clearGames: () => set({ games: [], selectedGames: [] }),

	// Game selection for adding to library
	toggleGameSelection: (game) => {
		const { selectedGames } = get();
		const isSelected = selectedGames.some((g) => g.path === game.path);

		if (isSelected) {
			set({ selectedGames: selectedGames.filter((g) => g.path !== game.path) });
		} else {
			set({ selectedGames: [...selectedGames, game] });
		}
	},

	setSelectedGames: (games) => set({ selectedGames: games }),

	clearSelectedGames: () => set({ selectedGames: [] }),

	selectAllGames: () => {
		const { games } = get();
		set({ selectedGames: [...games] });
	},

	isGameSelected: (gamePath) => {
		const { selectedGames } = get();
		return selectedGames.some((g) => g.path === gamePath);
	},

	// Step states
	setHasCompletedScanFolders: (hasCompleted) =>
		set({ hasCompletedScanFolders: hasCompleted }),
	setHasCompletedSelectGames: (hasCompleted) =>
		set({ hasCompletedSelectGames: hasCompleted }),
	setHasCompletedAddGames: (hasCompleted) =>
		set({ hasCompletedAddGames: hasCompleted }),

	// Reset all states
	reset: () => set(initialState),
}));
