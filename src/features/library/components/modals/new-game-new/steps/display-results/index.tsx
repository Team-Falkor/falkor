import { useCallback, useEffect, useState } from "react";
import type { IGDBReturnDataType } from "@/@types";
import { Input } from "@/components/ui/input";
import type { GenericStepProps } from "@/features/library/@types";
import { useNewGameStore } from "@/features/library/stores/new-game";
import useSearch from "@/features/search/hooks/useSearch";
import { getSteamIdFromWebsites } from "@/lib";
import { GameResultCard } from "./card";

interface Props extends GenericStepProps {}

export const DisplayResultsStop = ({ filename }: Props) => {
	// const { setBeforeNext } = useMultiStepDialog();
	const [searchQuery, setSearchQuery] = useState(filename);
	const { results, loading, error } = useSearch(searchQuery);

	const { selectedGame, setSelectedGame, updateGame, reset } =
		useNewGameStore();

	const handleChange = useCallback(
		(selectedGame: IGDBReturnDataType) => {
			const steamId = getSteamIdFromWebsites(selectedGame.websites);
			updateGame({
				gameName: selectedGame.name,
				gameIcon: `https://images.igdb.com/igdb/image/upload/t_thumb/${selectedGame.cover.image_id}.png`,
				igdbId: selectedGame.id?.toString(),
				steamId: steamId,
			});
		},
		[updateGame],
	);

	useEffect(() => {
		if (results && results.length > 0) {
			setSelectedGame(results[0]);
			handleChange(results[0]);
		} else {
			setSelectedGame(null);
			reset();
		}
	}, [handleChange, reset, results, setSelectedGame]);

	return (
		<div className="flex w-full flex-col gap-4 py-4">
			<Input
				value={searchQuery}
				onChange={(e) => setSearchQuery(e.target.value)}
				placeholder="Search for a game"
				className="w-full"
			/>

			<div className="flex max-h-[450px] w-full flex-col gap-2 overflow-y-auto p-1">
				{loading && <div className="p-4 text-center">Loading results...</div>}
				{error && (
					<div className="p-4 text-center text-destructive">
						An error occurred while searching.
					</div>
				)}
				{!loading && results.length === 0 && (
					<div className="p-4 text-center text-muted-foreground">
						No results found for "{searchQuery}".
					</div>
				)}
				{results.map((result) => (
					<GameResultCard
						key={result.id}
						result={result}
						isSelected={selectedGame?.id === result.id}
						onClick={() => setSelectedGame(result)}
					/>
				))}
			</div>
		</div>
	);
};
