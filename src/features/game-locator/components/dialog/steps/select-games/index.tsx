import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FileInfo } from "@/@types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGameLocatorStore } from "@/features/game-locator/stores/gameLocator";
import {
	chunkArray,
	countSelectedGames,
	createGamePathSet,
	filterAndSortGames,
	getEmptyStateType,
	isGameSelected,
} from "@/features/game-locator/utils";
import { EmptyState } from "./EmptyState";
import { GameCard } from "./GameCard";
import { GameGrid } from "./GameGrid";
import { SearchBar } from "./SearchBar";
import { SelectionControls } from "./SelectionControls";

export const GameLocatorSelectGamesStep = () => {
	const {
		games,
		selectedGames,
		toggleGameSelection,
		clearSelectedGames,
		setHasCompletedSelectGames,
	} = useGameLocatorStore();

	// Update completion state when games are selected
	useEffect(() => {
		setHasCompletedSelectGames(selectedGames.length > 0);
	}, [selectedGames.length, setHasCompletedSelectGames]);

	// Local state for search, filtering, and sorting
	const [searchQuery, setSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState<"name" | "size">("name");

	// Filter and search games using utility function
	const filteredGames = useMemo(() => {
		return filterAndSortGames(games, searchQuery, sortBy, true);
	}, [games, searchQuery, sortBy]);

	// Memoize selected games set for O(1) lookup
	const selectedGamePaths = useMemo(
		() => createGamePathSet(selectedGames),
		[selectedGames],
	);

	const isGameSelectedCallback = useCallback(
		(game: FileInfo) => {
			return isGameSelected(game, selectedGamePaths);
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
	const emptyStateType = useMemo(() => {
		return getEmptyStateType(games.length, filteredGames.length);
	}, [games.length, filteredGames.length]);

	// Use virtualized grid for large lists to improve performance
	const shouldUseVirtualization = filteredGames.length > 100;

	// Count selected games within the current filter
	const selectedInFilterCount = useMemo(
		() => countSelectedGames(filteredGames, selectedGamePaths),
		[filteredGames, selectedGamePaths],
	);

	// Virtual grid configuration
	const parentRef = useRef<HTMLDivElement>(null);
	const itemHeight = 140;
	const gap = 16;
	const columnsPerRow = 3; // Adjust based on your design needs

	// Calculate rows for virtualization using utility function
	const rows = useMemo(() => {
		return chunkArray(filteredGames, columnsPerRow);
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
														isSelected={isGameSelectedCallback(game)}
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
