import { useCallback, useEffect, useState } from "react";
import type { IGDBReturnDataType } from "@/@types";
import { Input } from "@/components/ui/input";
import type { GenericStepProps } from "@/features/library/@types";
import { useNewGameStore } from "@/features/library/stores/new-game";
import useSearch from "@/features/search/hooks/useSearch";
import { getSteamIdFromWebsites } from "@/lib";
import { GameResultCard } from "./card";

interface Props extends GenericStepProps {
	filename: string;
}

const LOG_PREFIX = "[DisplayResultsStop]";

export const DisplayResultsStop = ({ filename }: Props) => {
	const [searchQuery, setSearchQuery] = useState(filename);
	const { results, loading, error } = useSearch(searchQuery);

	const { selectedGame, setSelectedGame, updateGame, reset } =
		useNewGameStore();

	console.log(`${LOG_PREFIX} Render. Initial filename:`, {
		filename,
		searchQuery,
	});

	const handleGameSelection = useCallback(
		(selected: IGDBReturnDataType) => {
			console.log(`${LOG_PREFIX} Game selected from results:`, selected);
			setSelectedGame(selected);

			const steamId = getSteamIdFromWebsites(selected.websites);
			const gameUpdate = {
				gameName: selected.name,
				gameIcon: `https://images.igdb.com/igdb/image/upload/t_thumb/${selected.cover.image_id}.png`,
				igdbId: selected.id?.toString(),
				steamId: steamId,
			};
			console.log(`${LOG_PREFIX} Updating game store with:`, gameUpdate);
			updateGame(gameUpdate);
		},
		[updateGame, setSelectedGame],
	);

	useEffect(() => {
		console.log(`${LOG_PREFIX} Search query changed to:`, searchQuery);
	}, [searchQuery]);

	useEffect(() => {
		console.log(`${LOG_PREFIX} Search results updated.`, {
			loading,
			error: !!error,
			count: results?.length,
		});

		if (!loading && results) {
			if (results.length > 0) {
				console.log(
					`${LOG_PREFIX} Found ${results?.length} results. Auto-selecting first result.`,
				);
				handleGameSelection(results[0]);
			} else {
				console.log(`${LOG_PREFIX} No results found. Resetting store.`);
				setSelectedGame(null);
				reset();
			}
		}
	}, [results, loading, error, handleGameSelection, setSelectedGame, reset]);

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
						No results found for "{searchQuery}".
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
