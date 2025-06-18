import { useEffect, useState } from "react";
import type { IGDBReturnDataType } from "@/@types";
import { trpc } from "@/lib/trpc";
import useRecentSearches from "./useRecentSearches";

interface UseSearchResult {
	results: IGDBReturnDataType[];
	loading: boolean;
	error: string | null;
	recentSearches: string[];
	clearRecent: () => void;
}

interface UseSearchOptions {
	limit?: number;
	enableRecentSearches?: boolean;
}

export default function useSearch(
	query: string,
	options?: UseSearchOptions,
): UseSearchResult {
	const { limit, enableRecentSearches = true } = options ?? {};

	const [debouncedQuery, setDebouncedQuery] = useState(query);
	const { recentSearches, addSearch, clearSearches } = useRecentSearches(
		"recentSearches",
		10,
	);

	useEffect(() => {
		const handler = setTimeout(() => setDebouncedQuery(query), 400);
		return () => clearTimeout(handler);
	}, [query]);

	const { data, isLoading, error } = trpc.igdb.search.useQuery(
		{ query: debouncedQuery, limit },
		{ enabled: Boolean(debouncedQuery) },
	);

	// Record successful searches conditionally
	useEffect(() => {
		if (
			enableRecentSearches && // Check the improved option
			debouncedQuery &&
			data &&
			data.length > 0 &&
			recentSearches[0] !== debouncedQuery
		) {
			addSearch(debouncedQuery);
		}
	}, [debouncedQuery, data, addSearch, recentSearches, enableRecentSearches]);

	return {
		results: data ?? [],
		loading: isLoading,
		error: error?.message ?? null,
		recentSearches,
		clearRecent: clearSearches,
	};
}
