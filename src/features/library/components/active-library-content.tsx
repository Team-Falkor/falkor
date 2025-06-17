import { useMemo } from "react";
import DefaultCard from "@/components/cards/defaultCard";
import { EditGameOverlay } from "@/components/cards/list-card/overlay";
import { PlayStopButton } from "@/components/play-stop-button";
import { Badge } from "@/components/ui/badge";
import { H5, P } from "@/components/ui/typography";
import { useLanguageContext } from "@/i18n/I18N";
import { formatPlaytime, trpc } from "@/lib";
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
				{gamesList.map((game) => {
					const image = game.gameIcon;
					const imageURL = image ? image.replace("t_thumb", "t_cover_big") : "";

					return (
						<DefaultCard
							key={game.id}
							id={game.igdbId}
							name={game.gameName}
							cover={{
								image: imageURL,
								type: "image",
							}}
							renderActionButton={() => {
								return <PlayStopButton game={game} />;
							}}
							renderBadge={() => {
								return <EditGameOverlay key={game.id} game={game} />;
							}}
							renderBottomOfImage={() => {
								if (!game.gamePlaytime) return null;

								return (
									<Badge className="bg-muted/30 backdrop-blur-3xl">
										<span className="text-sm">
											{formatPlaytime(game.gamePlaytime)}
										</span>
									</Badge>
								);
							}}
						/>
					);
				})}
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
				{listGames.map((game) => {
					const image = game.gameIcon;
					const imageURL = image ? image.replace("t_thumb", "t_cover_big") : "";

					return (
						<DefaultCard
							key={game.id}
							id={game.igdbId}
							name={game.gameName}
							cover={{
								image: imageURL,
								type: "image",
							}}
							renderBadge={() => {
								return <EditGameOverlay key={game.id} game={game} />;
							}}
							renderActionButton={() => {
								return <PlayStopButton game={game} />;
							}}
							renderBottomOfImage={() => {
								if (!game.gamePlaytime) return null;

								return (
									<Badge className="bg-muted/30 backdrop-blur-3xl">
										<span className="text-sm">
											{formatPlaytime(game.gamePlaytime)}
										</span>
									</Badge>
								);
							}}
						/>
					);
				})}
			</div>
		);
	}

	return <P>Unknown library type.</P>;
};

export default ActiveLibraryContent;
