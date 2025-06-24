import { useCallback, useEffect, useState } from "react";
import type { Game, IGDBReturnDataType } from "@/@types";
import { Input } from "@/components/ui/input";
import type { GenericStepProps } from "@/features/library/@types";
import { useNewGameStore } from "@/features/library/stores/new-game";
import useSearch from "@/features/search/hooks/useSearch";
import { getSteamIdFromWebsites } from "@/lib";
import { GameResultCard } from "./card";

interface Props extends GenericStepProps {
	filename: string;
}

export const DisplayResultsStop = ({ filename }: Props) => {
	const [searchQuery, setSearchQuery] = useState(filename);
	const { results, loading, error } = useSearch(searchQuery, {
		enableRecentSearches: false,
		limit: 10,
	});

	const { selectedGame, setSelectedGame, updateGame } = useNewGameStore();

	const handleGameSelection = useCallback(
		(selected: IGDBReturnDataType) => {
			setSelectedGame(selected);

			const steamId = getSteamIdFromWebsites(selected.websites);
			const gameUpdate: Partial<Game> = {
				gameName: selected.name,
				gameIcon: selected.cover
					? `https://images.igdb.com/igdb/image/upload/t_thumb/${selected.cover.image_id}.png`
					: undefined,
				igdbId: selected.id,
				gameSteamId: steamId,
			};
			updateGame(gameUpdate);
		},
		[updateGame, setSelectedGame],
	);

	useEffect(() => {
		if (!loading && results) {
			if (results.length > 0) {
				handleGameSelection(results[0]);
			} else {
				setSelectedGame(null);
			}
		}
	}, [results, loading, handleGameSelection, setSelectedGame]);

	return (
		<div className="flex h-full w-full flex-col gap-4 overflow-hidden py-4">
			<Input
				value={searchQuery}
				onChange={(e) => setSearchQuery(e.target.value)}
				placeholder="Search for a game"
				className="w-full"
			/>

			<div className="flex w-full flex-1 flex-col gap-2 overflow-y-auto p-1">
				{loading && <div className="p-4 text-center">Loading results...</div>}
				{error && (
					<div className="p-4 text-center text-destructive">
						An error occurred while searching.
					</div>
				)}
				{!loading && results?.length === 0 && (
					<div className="p-4 text-center text-muted-foreground">
						No results found for "{searchQuery}". You can adjust details in the
						next step.
					</div>
				)}
				{(results ?? []).map((result) => (
					<GameResultCard
						key={result.id}
						result={result}
						isSelected={selectedGame?.id === result.id}
						onClick={() => handleGameSelection(result)}
					/>
				))}
			</div>
		</div>
	);
};
