import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useMemo, useRef, useState } from "react";
import type { FileInfo } from "@/@types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGameLocatorStore } from "@/features/game-locator/stores/gameLocator";
import { EmptyState } from "./EmptyState";
import { GameCard } from "./GameCard";
import { GameGrid } from "./GameGrid";
import { SearchBar } from "./SearchBar";
import { SelectionControls } from "./SelectionControls";

export const GameLocatorSelectGamesStep = () => {
	const { games, selectedGames, toggleGameSelection, clearSelectedGames } =
		useGameLocatorStore();

	// Local state for search, filtering, and sorting
	const [searchQuery, setSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState<"name" | "size">("name");

	// Filter and search games
	const filteredGames = useMemo(() => {
		let filtered = games.filter((game) => !game.isDirectory);

		// Apply search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim();
			filtered = filtered.filter(
				(game) =>
					game.name.toLowerCase().includes(query) ||
					game.path.toLowerCase().includes(query),
			);
		}

		// Apply sorting
		filtered.sort((a, b) => {
			if (sortBy === "name") {
				return a.name.localeCompare(b.name);
			}
			if (sortBy === "size") {
				return (b.size ?? 0) - (a.size ?? 0);
			}
			return 0;
		});

		return filtered;
	}, [games, searchQuery, sortBy]);

	// Memoize selected games set for O(1) lookup
	const selectedGamePaths = useMemo(
		() => new Set(selectedGames.map((game) => game.path)),
		[selectedGames],
	);

	const isGameSelected = useCallback(
		(game: FileInfo) => {
			return selectedGamePaths.has(game.path);
		},
		[selectedGamePaths],
	);

	// Memoize handlers to prevent unnecessary re-renders
	const handleClearSearch = useCallback(() => {
		setSearchQuery("");
	}, []);

	// Handle select all (only filtered games)
	const handleSelectAllFiltered = useCallback(() => {
		filteredGames.forEach((game) => {
			if (!selectedGamePaths.has(game.path)) {
				toggleGameSelection(game);
			}
		});
	}, [filteredGames, selectedGamePaths, toggleGameSelection]);

	// Memoize empty state type calculation
	const emptyStateType = useMemo(():
		| "no-games"
		| "no-results"
		| "no-selection" => {
		if (games.length === 0) return "no-games";
		if (filteredGames.length === 0) return "no-results";
		return "no-selection";
	}, [games.length, filteredGames.length]);

	// Use virtualized grid for large lists to improve performance
	const shouldUseVirtualization = filteredGames.length > 100;

	// Count selected games within the current filter
	const selectedInFilterCount = useMemo(
		() =>
			filteredGames.filter((game) => selectedGamePaths.has(game.path)).length,
		[filteredGames, selectedGamePaths],
	);

	// Virtual grid configuration
	const parentRef = useRef<HTMLDivElement>(null);
	const itemHeight = 140;
	const gap = 16;
	const columnsPerRow = 3; // Adjust based on your design needs

	// Calculate rows for virtualization
	const rows = useMemo(() => {
		const gameRows: FileInfo[][] = [];
		for (let i = 0; i < filteredGames.length; i += columnsPerRow) {
			gameRows.push(filteredGames.slice(i, i + columnsPerRow));
		}
		return gameRows;
	}, [filteredGames]);

	const virtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => itemHeight + gap,
		overscan: 3,
	});

	return (
		<div className="flex h-full flex-col space-y-4 overflow-hidden">
			{/* Search and Filter Controls */}
			<div className="flex-shrink-0">
				<SearchBar
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
					sortBy={sortBy}
					onSortChange={setSortBy}
					totalGames={games.length}
					filteredGames={filteredGames.length}
				/>
			</div>

			{/* Selection Controls */}
			{filteredGames.length > 0 && (
				<div className="flex-shrink-0">
					<SelectionControls
						totalGames={filteredGames.length}
						selectedCount={selectedInFilterCount}
						onSelectAll={handleSelectAllFiltered}
						onClearSelection={clearSelectedGames}
					/>
				</div>
			)}

			{/* Games Grid */}
			<div className="flex-1 overflow-hidden">
				{filteredGames.length === 0 ? (
					<EmptyState
						type={emptyStateType}
						searchQuery={searchQuery}
						onClearSearch={handleClearSearch}
						className="h-full"
					/>
				) : shouldUseVirtualization ? (
					<div
						ref={parentRef}
						className="h-full overflow-auto"
						style={{
							overflowAnchor: "none",
							contain: "layout style paint",
						}}
					>
						<div
							style={{
								height: `${virtualizer.getTotalSize()}px`,
								width: "100%",
								position: "relative",
							}}
						>
							{virtualizer.getVirtualItems().map((virtualRow) => {
								const rowGames = rows[virtualRow.index];
								return (
									<div
										key={virtualRow.key}
										style={{
											position: "absolute",
											top: 0,
											left: 0,
											width: "100%",
											height: `${virtualRow.size}px`,
											transform: `translateY(${virtualRow.start}px)`,
											overflow: "hidden",
										}}
									>
										<div
											className="grid gap-4 p-2"
											style={{
												gridTemplateColumns: `repeat(${columnsPerRow}, minmax(0, 1fr))`,
												height: `${itemHeight}px`,
												gridTemplateRows: `${itemHeight}px`,
											}}
										>
											{rowGames.map((game) => (
												<div
													key={game.path}
													style={{
														height: `${itemHeight}px`,
														overflow: "hidden",
													}}
												>
													<GameCard
														game={game}
														isSelected={isGameSelected(game)}
														onToggleSelection={toggleGameSelection}
													/>
												</div>
											))}
										</div>
									</div>
								);
							})}
						</div>
					</div>
				) : (
					<ScrollArea
						className="h-full"
						style={{
							// Improve scroll performance
							overflowAnchor: "none",
							containIntrinsicSize: "auto 500px",
						}}
					>
						<div className="pb-6">
							<GameGrid
								games={filteredGames}
								selectedGames={selectedGames}
								onToggleSelection={toggleGameSelection}
								emptyStateType={emptyStateType}
								searchQuery={searchQuery}
								onClearSearch={handleClearSearch}
								// onRescan could be added here if needed
							/>
						</div>
					</ScrollArea>
				)}
			</div>
		</div>
	);
};
