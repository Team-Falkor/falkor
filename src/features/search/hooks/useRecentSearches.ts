import { useEffect, useState } from "react";

interface UseRecentSearches {
	/**
	 * An array of recent search terms stored in localStorage.
	 */
	recentSearches: string[];
	/**
	 * Adds a new search term to the list of recent searches.
	 * Ensures no duplicates and respects the limit.
	 * @param search The search term to add.
	 */
	addSearch: (search: string) => void;
	/**
	 * Clears all recent searches from the list and localStorage.
	 */
	clearSearches: () => void;
}

/**
 * A custom React hook for managing recent searches using localStorage.
 *
 * @param {string} storageKey - The key to use for storing data in localStorage.
 * @param {number} [limit=10] - The maximum number of recent searches to store.
 * @returns {UseRecentSearches} An object containing the recent searches,
 * a function to add a new search, and a function to clear all searches.
 */
const useRecentSearches = (
	storageKey: string,
	limit = 10,
): UseRecentSearches => {
	/**
	 * State to hold the array of recent searches.
	 * Initializes by reading from localStorage.
	 * Ensures the state is always a string array.
	 */
	const [recentSearches, setRecentSearches] = useState<string[]>(() => {
		try {
			const item = window.localStorage.getItem(storageKey);
			// Attempt to parse the stored item. If it's not a valid array, default to [].
			const parsedItem = item ? JSON.parse(item) : [];
			return Array.isArray(parsedItem) ? (parsedItem as string[]) : [];
		} catch (error) {
			// If any error occurs during retrieval or parsing, default to an empty array.
			console.error("Error reading from localStorage:", error);
			return [];
		}
	});

	/**
	 * Effect to synchronize the recent searches state with localStorage whenever it changes.
	 */
	useEffect(() => {
		try {
			window.localStorage.setItem(storageKey, JSON.stringify(recentSearches));
		} catch (error) {
			console.error("Error writing to localStorage:", error);
		}
	}, [recentSearches, storageKey]);

	/**
	 * Adds a new search term to the list of recent searches.
	 * Ensures no duplicates and respects the limit.
	 *
	 * @param {string} search - The search term to add.
	 */
	const addSearch = (search: string): void => {
		if (!search || typeof search !== "string") {
			return; // Don't add empty or non-string searches
		}

		setRecentSearches((prevSearches) => {
			// Ensure prevSearches is treated as an array (though useState with initial [] and array manipulations guarantees this)
			const currentSearches = Array.isArray(prevSearches) ? prevSearches : [];
			// Remove duplicates and add the new search at the beginning
			const newSearches = [
				search,
				...currentSearches.filter((item) => item !== search),
			];
			// Limit the number of searches
			return newSearches.slice(0, limit);
		});
	};

	/**
	 * Clears all recent searches from the list and localStorage.
	 */
	const clearSearches = (): void => {
		setRecentSearches([]);
		try {
			window.localStorage.removeItem(storageKey);
		} catch (error) {
			console.error("Error clearing localStorage:", error);
		}
	};

	return {
		recentSearches,
		addSearch,
		clearSearches,
	};
};

export default useRecentSearches;
