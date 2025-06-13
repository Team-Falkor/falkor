import { useMemo } from "react";
import type { IGDBReturnDataType } from "@/@types";
import DefaultCard from "@/components/cards/defaultCard";
import CarouselButton from "@/components/carouselButton";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
} from "@/components/ui/carousel";
import { H2 } from "@/components/ui/typography";
import { useLanguageContext } from "@/i18n/I18N";

interface SimilarGamesProps {
	data: IGDBReturnDataType["similar_games"];
}

const SimilarGames = ({ data }: SimilarGamesProps) => {
	const { t } = useLanguageContext();

	const items = useMemo(() => data, [data]);

	if (!items?.length) return null;

	return (
		<div>
			<Carousel
				opts={{
					skipSnaps: true,
					dragFree: true,
				}}
				className="w-full"
			>
				<div className="mb-2 flex justify-between">
					<H2>{t("you_may_also_like")}</H2>
					<div>
						<CarouselButton direction="left" />
						<CarouselButton direction="right" />
					</div>
				</div>

				<CarouselContent className="-ml-2">
					{items.map((game) => (
						<CarouselItem key={game.id} className="basis-auto px-2">
							<DefaultCard
								key={game.id}
								{...game}
								cover={{
									image: game.cover?.image_id,
									type: "image_id",
								}}
							/>
						</CarouselItem>
					))}
				</CarouselContent>
			</Carousel>
		</div>
	);
};

export default SimilarGames;
