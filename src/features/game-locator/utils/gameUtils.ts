import type { FileInfo } from "@/@types";

/**
 * Filters games based on search query
 * @param games - Array of games to filter
 * @param searchQuery - Search query string
 * @returns Filtered array of games
 */
export function filterGamesBySearch(
	games: FileInfo[],
	searchQuery: string,
): FileInfo[] {
	if (!searchQuery.trim()) {
		return games;
	}

	const query = searchQuery.toLowerCase().trim();
	return games.filter(
		(game) =>
			game.name.toLowerCase().includes(query) ||
			game.path.toLowerCase().includes(query),
	);
}

/**
 * Sorts games by specified criteria
 * @param games - Array of games to sort
 * @param sortBy - Sort criteria ('name' or 'size')
 * @returns Sorted array of games
 */
export function sortGames(
	games: FileInfo[],
	sortBy: "name" | "size",
): FileInfo[] {
	return [...games].sort((a, b) => {
		if (sortBy === "name") {
			return a.name.localeCompare(b.name);
		}
		if (sortBy === "size") {
			return (b.size ?? 0) - (a.size ?? 0);
		}
		return 0;
	});
}

/**
 * Filters and sorts games in one operation
 * @param games - Array of games to process
 * @param searchQuery - Search query string
 * @param sortBy - Sort criteria
 * @param excludeDirectories - Whether to exclude directories
 * @returns Processed array of games
 */
export function filterAndSortGames(
	games: FileInfo[],
	searchQuery: string,
	sortBy: "name" | "size",
	excludeDirectories = true,
): FileInfo[] {
	let filtered = excludeDirectories
		? games.filter((game) => !game.isDirectory)
		: games;
	filtered = filterGamesBySearch(filtered, searchQuery);
	return sortGames(filtered, sortBy);
}

/**
 * Creates a Set of game paths for O(1) lookup performance
 * @param games - Array of games
 * @returns Set of game paths
 */
export function createGamePathSet(games: FileInfo[]): Set<string> {
	return new Set(games.map((game) => game.path));
}

/**
 * Checks if a game is selected based on a path set
 * @param game - Game to check
 * @param selectedPaths - Set of selected game paths
 * @returns Whether the game is selected
 */
export function isGameSelected(
	game: FileInfo,
	selectedPaths: Set<string>,
): boolean {
	return selectedPaths.has(game.path);
}

/**
 * Counts selected games within a filtered list
 * @param games - Array of games to check
 * @param selectedPaths - Set of selected game paths
 * @returns Number of selected games in the list
 */
export function countSelectedGames(
	games: FileInfo[],
	selectedPaths: Set<string>,
): number {
	return games.filter((game) => selectedPaths.has(game.path)).length;
}

/**
 * Formats file size in human-readable format
 * @param bytes - Size in bytes
 * @returns Formatted size string
 */
export function formatFileSize(bytes?: number): string {
	if (!bytes || bytes === 0) return "0 B";

	const units = ["B", "KB", "MB", "GB", "TB"];
	const base = 1024;
	const unitIndex = Math.floor(Math.log(bytes) / Math.log(base));
	const size = bytes / base ** unitIndex;

	return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/**
 * Chunks an array into smaller arrays of specified size
 * @param array - Array to chunk
 * @param size - Size of each chunk
 * @returns Array of chunks
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
	const chunks: T[][] = [];
	for (let i = 0; i < array.length; i += size) {
		chunks.push(array.slice(i, i + size));
	}
	return chunks;
}

/**
 * Determines the type of empty state to show
 * @param totalGames - Total number of games
 * @param filteredGames - Number of filtered games
 * @returns Empty state type
 */
export function getEmptyStateType(
	totalGames: number,
	filteredGames: number,
): "no-games" | "no-results" | "no-selection" {
	if (totalGames === 0) return "no-games";
	if (filteredGames === 0) return "no-results";
	return "no-selection";
}
