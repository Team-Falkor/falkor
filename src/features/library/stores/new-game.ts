import { create } from "zustand";
import type { IGDBReturnDataType } from "@/@types";

/**
 * The core data structure for a game in the library.
 */
export type Game = {
	gameName: string;
	gamePath: string;
	gameId: string;
	gameIcon: string;
	gameArgs?: string;
	gameCommand?: string;
	igdbId?: string;
	steamId?: string;
	winePrefixFolder?: string;
	installed?: boolean;
};

interface NewGameState {
	/** the currntly selected game */
	selectedGame?: IGDBReturnDataType | null;
	/** The game data being progressively built. */
	game: Partial<Game>;
	/** An error message, if any. */
	error: string | null;
}

interface NewGameActions {
	/**
	 * Sets the initial data after file selection and parsing.
	 * This should be the first action called in the flow.
	 */
	setInitialData: (data: Partial<Game>) => void;
	/**
	 * Merges new or updated data into the existing game object.
	 * Use this for API results or manual user edits.
	 */
	updateGame: (data: Partial<Game>) => void;
	/** Sets an error message. */
	setError: (message: string) => void;
	/** Resets the store to its initial state, ready for a new entry. */
	reset: () => void;
	setSelectedGame: (game: IGDBReturnDataType | null) => void;
}

const initialState: NewGameState = {
	selectedGame: undefined,
	game: {},
	error: null,
};

export const useNewGameStore = create<NewGameState & NewGameActions>((set) => ({
	...initialState,

	setInitialData: (data) =>
		set({
			game: data,
			error: null,
		}),

	updateGame: (data) =>
		set((state) => ({
			game: { ...state.game, ...data },
		})),

	setError: (message) => set({ error: message }),

	reset: () => set(initialState),

	setSelectedGame: (game) => set({ selectedGame: game }),
}));
