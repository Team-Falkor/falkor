// src/components/active-library/active-library-content.tsx

import { useMemo } from "react";
import ContinuePlayingCard from "@/components/cards/continue-playing";
import ListCard from "@/components/cards/list-card";
import { H5, P } from "@/components/ui/typography";
import { trpc } from "@/lib";

import { useGames } from "../hooks/use-games";
import type { ActiveLibraryProps } from "./active-library";

const ActiveLibraryContent = (props: ActiveLibraryProps) => {
	const { type } = props;

	// === Hooks ===
	const {
		fetchGames,
		deleteGame: deleteGameMutation,
		updateGame: updateGameMutation,
		games: gamesMap,
	} = useGames(true);
	const gamesList = useMemo(() => Object.values(gamesMap), [gamesMap]);

	// For the list query, pass a dummy ID when we’re not in “list” mode,
	// and disable it via `enabled: type === "list"`.
	const listQuery = trpc.lists.getByIdWithGames.useQuery(
		// only valid when type === "list"
		type === "list" ? props.listId : -1,
		{ enabled: type === "list" },
	);
	const listGames = listQuery.data?.games ?? [];

	// === Render branches ===
	if (type === "game") {
		if (gamesList.length === 0) {
			return <H5>You have not added any games to continue playing.</H5>;
		}
		return (
			<div className="flex flex-wrap gap-4">
				{gamesList.map((game) => (
					<ContinuePlayingCard
						key={game.id}
						bg_image={game.gameIcon ?? ""}
						game={game}
						fetchGames={fetchGames}
						deleteGame={(gameId: string) =>
							deleteGameMutation({ id: Number(gameId) })
						}
						updateGame={(updates) => updateGameMutation(updates)}
					/>
				))}
			</div>
		);
	}

	if (type === "list") {
		if (listQuery.isLoading) {
			return (
				<div className="flex items-center justify-center">
					<H5>Loading...</H5>
				</div>
			);
		}
		if (listQuery.isError) {
			return (
				<div className="flex items-center justify-center">
					<H5>Something went wrong. Please try again later.</H5>
				</div>
			);
		}
		if (listGames.length === 0) {
			return <P>No games in this list.</P>;
		}
		return (
			<div className="flex flex-wrap gap-4">
				{listGames.map((game) => (
					// Assuming ListCard expects a full `LibraryGame` object:
					<ListCard key={game.id} {...game} />
				))}
			</div>
		);
	}

	return <P>Unknown library type.</P>;
};

export default ActiveLibraryContent;
