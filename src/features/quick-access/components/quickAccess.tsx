// TODO: Use QuickAccess
// For now use Recent Games until added the Quick Access feature

import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useId } from "react";
import CarouselButton from "@/components/carouselButton";
import IGDBImage from "@/components/IGDBImage";
import { Button } from "@/components/ui/button";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
} from "@/components/ui/carousel";
import { H2, TypographySmall } from "@/components/ui/typography";
import { useLanguageContext } from "@/i18n/I18N";
import { trpc } from "@/lib";

export const QuickAccess = () => {
	const id = useId();
	const { t } = useLanguageContext();
	const { data: recentGames, isLoading } = trpc.library.recentGames.useQuery({
		limit: 5,
	});

	if (isLoading) {
		return <div>Loading...</div>;
	}

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
							<TypographySmall>{t("view_more")}</TypographySmall>
						</Link>
					</div>

					<div>
						<CarouselButton direction="left" id={"quick-access-left-btn"} />
						<CarouselButton direction="right" id={"quick-access-right-btn"} />
					</div>
				</div>

				<div className="flex flex-row gap-2 pt-2">
					<Button className="size-40 flex-col gap-2">
						<Plus className="size-6" />
						<TypographySmall>Add Game</TypographySmall>
					</Button>

					<div className="w-full flex-1">
						<CarouselContent className="w-full flex-1">
							{!!recentGames &&
								recentGames.map((game) => (
									<CarouselItem key={game.id} className="basis-44">
										<div className="relative size-40 overflow-hidden rounded-xl">
											<div className="absolute inset-0 size-full">
												<IGDBImage
													imageId={game.gameIcon ?? ""}
													alt={game.gameName}
													className="w-full object-cover"
												/>
											</div>
										</div>
									</CarouselItem>
								))}
						</CarouselContent>
					</div>
				</div>
			</Carousel>
		</div>
	);
};
