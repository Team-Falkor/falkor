import {
  LibraryGame,
  LibraryGameUpdate,
  NewLibraryGame,
} from "@/@types/library/types";
import { invoke } from "@/lib";
import { create } from "zustand";

// Define the invoke function wrapper with appropriate type arguments for each database action.
const gamesDB = <T, A = any>(name: string, ...args: A[]) =>
  invoke<T>(`games:${name}`, ...args);

interface GamesState {
  games: Record<string, LibraryGame>;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  fetchGames: () => Promise<void>;
  addGame: (game: NewLibraryGame) => Promise<void>;
  getGameById: (gameId: string) => Promise<LibraryGame | null>;
  getGameByIGDBId: (gameId: string) => Promise<LibraryGame | null>;
  updateGame: (gameId: string, updates: LibraryGameUpdate) => Promise<void>;
  deleteGame: (gameId: string) => Promise<void>;
  clearError: () => void;
}

export const useGamesStore = create<GamesState>((set, get) => ({
  games: {},
  loading: false,
  error: null,
  lastUpdated: null,

  clearError: () => set({ error: null }),

  fetchGames: async () => {
    const lastUpdated = get().lastUpdated;
    const now = Date.now();
    
    // Only fetch if data is stale (older than 5 minutes)
    if (lastUpdated && now - lastUpdated < 300000) {
      return;
    }

    set({ loading: true, error: null });
    try {
      const games = await gamesDB<LibraryGame[]>("get-all-games");
      if (!games) {
        set({ error: "No games found" });
        return;
      }

      const gamesMap = games.reduce<Record<string, LibraryGame>>(
        (acc, game) => {
          acc[game.id] = game;
          return acc;
        },
        {}
      );

      set({ games: gamesMap, lastUpdated: now });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch games";
      console.error("Error fetching games:", error);
      set({ error: errorMessage });
    } finally {
      set({ loading: false });
    }
  },

  addGame: async (game) => {
    set({ loading: true, error: null });
    try {
      const newGame = await gamesDB<LibraryGame, NewLibraryGame>(
        "add-game",
        game
      );

      if (!newGame) return;

      set((state) => ({
        games: { ...state.games, [newGame.game_id]: newGame },
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add game";
      console.error("Error adding game:", error);
      set({ error: errorMessage });
    } finally {
      set({ loading: false });
    }
  },

  getGameById: async (gameId) => {
    set({ loading: true, error: null });
    try {
      const game = await gamesDB<LibraryGame | null, string>(
        "get-game-by-id",
        gameId
      );
      if (game) {
        set((state) => ({
          games: { ...state.games, [gameId]: game },
        }));
      }
      return game;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch game";
      console.error("Error fetching game:", error);
      set({ error: errorMessage });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  getGameByIGDBId: async (gameId) => {
    set({ loading: true, error: null });
    try {
      const game = await gamesDB<LibraryGame | null, string>(
        "get-game-by-igdb-id",
        gameId
      );

      console.log({ game });

      if (game) {
        set((state) => ({
          games: { ...state.games, [gameId]: game },
        }));
      }
      return game;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch game";
      console.error("Error fetching game:", error);
      set({ error: errorMessage });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  updateGame: async (gameId, updates) => {
    set({ loading: true, error: null });
    try {
      await gamesDB<void, any>("update-game", gameId, updates);
      set((state) => ({
        games: {
          ...state.games,
          [gameId]: { ...state.games[gameId], ...updates },
        },
      }));
    } catch (error) {
      console.error(error);
      set({ error: "Failed to update game" });
    } finally {
      set({ loading: false });
    }
  },

  deleteGame: async (gameId) => {
    set({ loading: true, error: null });
    try {
      await gamesDB<void, string>("delete-game", gameId);

      set((state) => {
        const updatedGames = { ...state.games };
        delete updatedGames[gameId];
        return { games: updatedGames };
      });
    } catch (error) {
      console.error(error);
      set({ error: "Failed to delete game" });
    } finally {
      set({ loading: false });
    }
  },
}));
