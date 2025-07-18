import { memo, useCallback, useMemo } from "react";
import type { FileInfo } from "@/@types";
import { cn } from "@/lib/utils";
import { EmptyState } from "./EmptyState";
import { GameCard } from "./GameCard";
import { LoadingState } from "./LoadingState";

interface GameGridProps {
	games: FileInfo[];
	selectedGames: FileInfo[];
	onToggleSelection: (game: FileInfo) => void;
	isLoading?: boolean;
	loadingMessage?: string;
	emptyStateType?: "no-games" | "no-results" | "no-selection";
	searchQuery?: string;
	onClearSearch?: () => void;
	onRescan?: () => void;
	showSelectionControls?: boolean;
	className?: string;
}

export const GameGrid = memo(
	({
		games,
		selectedGames,
		onToggleSelection,
		isLoading = false,
		loadingMessage,
		emptyStateType = "no-games",
		searchQuery,
		onClearSearch,
		onRescan,
		showSelectionControls = true,
		className,
	}: GameGridProps) => {
		// Memoize selected games set for O(1) lookup
		const selectedGamePaths = useMemo(() => {
			return new Set(selectedGames.map((game) => game.path));
		}, [selectedGames]);

		const isGameSelected = useCallback(
			(game: FileInfo) => {
				return selectedGamePaths.has(game.path);
			},
			[selectedGamePaths],
		);

		if (isLoading) {
			return (
				<LoadingState
					message={loadingMessage}
					showSkeletons={true}
					skeletonCount={6}
					className={className}
				/>
			);
		}

		if (games.length === 0) {
			return (
				<EmptyState
					type={emptyStateType}
					searchQuery={searchQuery}
					onClearSearch={onClearSearch}
					onRescan={onRescan}
					className={className}
				/>
			);
		}

		return (
			<div
				className={cn(
					"grid auto-rows-min gap-4",
					// Responsive grid: 1 column on mobile, 2 on tablet, 3 on desktop
					"grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
					// Improve scroll performance
					"will-change-scroll",
					className,
				)}
				style={{
					// Enable hardware acceleration for better scroll performance
					transform: "translateZ(0)",
					backfaceVisibility: "hidden",
				}}
			>
				{games.map((game) => (
					<GameCard
						key={game.path}
						game={game}
						isSelected={isGameSelected(game)}
						onToggleSelection={onToggleSelection}
						showSelectionControls={showSelectionControls}
					/>
				))}
			</div>
		);
	},
);
