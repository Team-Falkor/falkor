import { List, ListGame } from "@/@types";
import { create } from "zustand";

const listsDB = (name: string, ...args: any[]) =>
  window?.ipcRenderer.invoke(`lists:${name}`, ...args);

type ListId = number;

interface ListsState {
  lists: List[];
  gamesInList: Record<ListId, ListGame[]>;
  loading: boolean;
  error: string | null;
  hasDoneFirstFetch: boolean;
  lastUpdated: number | null;
  fetchLists: () => Promise<Array<List>>;
  createList: (name: string, description?: string) => Promise<void>;
  addGameToList: (listId: ListId, game: ListGame) => Promise<void>;
  removeGameFromList: (listId: ListId, gameId: number) => Promise<void>;
  fetchGamesInList: (listId: ListId) => Promise<Array<ListGame>>;
  deleteList: (listId: ListId) => Promise<void>;
  setHasDoneFirstFetch: () => void;
  clearError: () => void;
}

// Zustand store to handle lists and games globally
export const useListsStore = create<ListsState>((set, get) => ({
  lists: [],
  gamesInList: {},
  loading: false,
  error: null,
  hasDoneFirstFetch: false,
  lastUpdated: null,

  clearError: () => set({ error: null }),

  setHasDoneFirstFetch: () => {
    set({ hasDoneFirstFetch: true });
  },

  fetchLists: async () => {
    const lastUpdated = get().lastUpdated;
    const now = Date.now();
    
    // Only fetch if data is stale (older than 5 minutes)
    if (lastUpdated && now - lastUpdated < 300000) {
      return get().lists;
    }

    set({ loading: true, error: null });
    try {
      const fetchedLists = await listsDB("get-all-lists");
      if (!fetchedLists) {
        throw new Error("No lists found");
      }
      set({ lists: fetchedLists, lastUpdated: now });

      return fetchedLists;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load lists";
      console.error("Error loading lists:", error);
      set({ error: errorMessage });

      return [];
    } finally {
      set({ loading: false });
    }
  },

  createList: async (name: string, description?: string) => {
    set({ loading: true, error: null });
    try {
      await listsDB("create-list", name, description);
      await useListsStore.getState().fetchLists(); // Refresh lists after creating a new one
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create list";
      console.error("Error creating list:", error);
      set({ error: errorMessage });
    } finally {
      set({ loading: false });
    }
  },

  addGameToList: async (listId: number, game: ListGame) => {
    set({ loading: true, error: null });
    try {
      await listsDB("add-game-to-list", listId, game);
      await useListsStore.getState().fetchGamesInList(listId); // Refresh games after adding a new one
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add game to list";
      console.error("Error adding game to list:", error);
      set({ error: errorMessage });
    } finally {
      set({ loading: false });
    }
  },

  removeGameFromList: async (listId: number, gameId: number) => {
    set({ loading: true, error: null });
    try {
      await listsDB("remove-game-from-list", listId, gameId);
      await useListsStore.getState().fetchGamesInList(listId); // Refresh games after removing a game
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to remove game from list";
      console.error("Error removing game from list:", error);
      set({ error: errorMessage });
    } finally {
      set({ loading: false });
    }
  },

  fetchGamesInList: async (listId: number) => {
    set({ loading: true, error: null });
    try {
      const games = await listsDB("get-games-in-list", listId);
      set((state) => ({
        gamesInList: {
          ...state.gamesInList,
          [listId]: games,
        },
      }));

      return games;
    } catch {
      set({ error: "Failed to load games" });
      return [];
    } finally {
      set({ loading: false });
    }
  },

  deleteList: async (listId: number) => {
    set({ loading: true, error: null });
    try {
      await listsDB("delete-list", listId);
      await useListsStore.getState().fetchLists(); // Refresh lists after deleting a list
    } catch {
      set({ error: "Failed to delete list" });
    } finally {
      set({ loading: false });
    }
  },
}));
