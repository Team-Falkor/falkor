import { useMemo } from "react";
import ListCard from "@/components/cards/list-card";
import { H5, P } from "@/components/ui/typography";
import { useLanguageContext } from "@/i18n/I18N";
import { trpc } from "@/lib";
import { useGames } from "../hooks/use-games";
import type { ActiveLibraryProps } from "./active-library";

const ActiveLibraryContent = (props: ActiveLibraryProps) => {
	const { t } = useLanguageContext();
	const { type } = props;

	const { games: gamesFromHook } = useGames();
	const gamesList = useMemo(
		() => Object.values(gamesFromHook),
		[gamesFromHook],
	);

	const listQuery = trpc.lists.getByIdWithGames.useQuery(
		type === "list" ? props.listId : -1,
		{
			enabled: type === "list" && props.listId !== -1,
			staleTime: 1000 * 60 * 5,
			refetchInterval: 1000 * 60 * 5,
		},
	);

	const listGames = listQuery.data?.games ?? [];

	if (type === "game") {
		if (gamesList.length === 0) {
			return <H5>{t("no_games_installed")}</H5>;
		}

		return (
			<div className="flex flex-wrap gap-4">
				{gamesList.map((game) => (
					<ListCard key={game.id} {...game} />
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
					<ListCard key={game.id} {...game} />
				))}
			</div>
		);
	}

	return <P>Unknown library type.</P>;
};

export default ActiveLibraryContent;
