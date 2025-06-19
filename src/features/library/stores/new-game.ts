import { create } from "zustand";
import type { Game, IGDBReturnDataType } from "@/@types";

interface NewGameState {
	selectedGame?: IGDBReturnDataType | null;
	game: Partial<Game>;
	error: string | null;
}

interface NewGameActions {
	setInitialData: (data: Partial<Game>) => void;
	updateGame: (data: Partial<Game>) => void;
	setError: (message: string) => void;
	reset: () => void;
	setSelectedGame: (game: IGDBReturnDataType | null) => void;
}

const initialState: NewGameState = {
	selectedGame: undefined,
	game: {
		runAsAdmin: false,
		gameArgs: "",
		winePrefixFolder: "",
	},
	error: null,
};

export const useNewGameStore = create<NewGameState & NewGameActions>((set) => ({
	...initialState,

	setInitialData: (data) =>
		set((state) => ({
			game: { ...state.game, ...data },
			error: null,
		})),

	updateGame: (data) =>
		set((state) => ({
			game: { ...state.game, ...data },
		})),

	setError: (message) => set({ error: message }),

	reset: () => set(initialState),

	setSelectedGame: (game) => set({ selectedGame: game }),
}));
