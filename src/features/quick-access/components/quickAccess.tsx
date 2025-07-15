// TODO: Use QuickAccess
// For now use Recent Games until added the Quick Access feature

import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useId, useState } from "react";
import type { Game } from "@/@types";
import DefaultCard from "@/components/cards/defaultCard";
import { EditGameOverlay } from "@/components/cards/list-card/overlay";
import CarouselButton from "@/components/carouselButton";
import { PlayStopButton } from "@/components/play-stop-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
} from "@/components/ui/carousel";
import { H2, TypographySmall } from "@/components/ui/typography";
import { NewGameDialog } from "@/features/library/components/modals/new-game";
import { useLanguageContext } from "@/i18n/I18N";
import { formatPlaytime, trpc } from "@/lib";

const LIMIT = 15;
export const QuickAccess = () => {
	const [open, setOpen] = useState(false);
	const id = useId();
	const { t } = useLanguageContext();
	const { data: recentGames, isLoading } = trpc.library.recentGames.useQuery({
		limit: 15,
	});

	// Create placeholder items array
	const placeholders = Array.from({ length: LIMIT }, (_, index) => ({
		id: `placeholder-${index}`,
	}));

	// Determine what to render: placeholders or actual games
	const itemsToRender =
		isLoading || !recentGames
			? placeholders
			: [...recentGames, ...placeholders.slice(recentGames.length)];

	return (
		<div className="mb-6 rounded-lg bg-muted/30 p-6">
			<Carousel
				id={id}
				opts={{
					skipSnaps: true,
					dragFree: true,
				}}
			>
				<div className="flex items-center justify-between pb-2">
					<div className="flex items-end gap-2">
						<H2>{t("sections.quick_access")}</H2>

						{/* This Link will now generate the correct, flattened URL */}
						<Link
							to={"/library"}
							className="text-muted-foreground focus-states:underline"
						>
							<TypographySmall>{t("view_all")}</TypographySmall>
						</Link>
					</div>

					<div>
						<CarouselButton direction="left" id={"quick-access-left-btn"} />
						<CarouselButton direction="right" id={"quick-access-right-btn"} />
					</div>
				</div>

				<div className="flex flex-row gap-2 pt-2">
					<NewGameDialog setOpen={setOpen} open={open}>
						<Button
							className="size-48 flex-col gap-2"
							onClick={() => {
								setOpen(true);
							}}
						>
							<Plus className="size-6" />
							<TypographySmall>{t("add_game")}</TypographySmall>
						</Button>
					</NewGameDialog>

					<div className="w-full flex-1 overflow-hidden">
						<CarouselContent className="w-full flex-1">
							{itemsToRender.map((item) => {
								// Check if this is a placeholder or actual game
								const isPlaceholder = item.id
									.toString()
									.startsWith("placeholder-");

								if (isPlaceholder) {
									// Render placeholder div
									return (
										<CarouselItem key={item.id} className="basis-52">
											<div className="size-48 rounded-xl bg-muted/70">
												{isLoading && (
													<div className="h-full w-full animate-pulse rounded-lg bg-muted/40" />
												)}
											</div>
										</CarouselItem>
									);
								}

								// Render actual game
								const game = item as Game; // type assertion because we know it's a Game
								const image = game.gameIcon;
								const imageURL = image
									? image.replace("t_thumb", "t_cover_big")
									: "";

								return (
									<CarouselItem key={game.id} className="basis-52">
										<DefaultCard
											key={game.id}
											id={game.igdbId}
											name={game.gameName}
											cover={{
												image: imageURL,
												type: "image",
											}}
											className="size-48"
											square={true}
											hideTitle={true}
											renderBadge={() => {
												return <EditGameOverlay key={game.id} game={game} />;
											}}
											renderCenterOfImage={() => {
												return (
													<PlayStopButton game={game} simpleStyle={true} />
												);
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
									</CarouselItem>
								);
							})}
						</CarouselContent>
					</div>
				</div>
			</Carousel>
		</div>
	);
};
