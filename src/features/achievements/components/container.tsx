import { t } from "i18next";
import CarouselButton from "@/components/carouselButton";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
} from "@/components/ui/carousel";
import { H2, TypographyMuted } from "@/components/ui/typography";
import { trpc } from "@/lib";
import { AchievementCard } from "./cards/achievement";

interface Props {
	steamId: string;
	gameId: string;
}

const AchievementContainer = ({ steamId, gameId }: Props) => {
	const { isPending, isError, data } =
		trpc.achachievements.getUnlockedWithGameData.useQuery({ steamId, gameId });

	if (isPending) return null;
	if (isError) return null;

	const unlocked = data?.filter((achievement) => achievement.unlocked);

	return (
		<div className="rounded-lg bg-muted/30 p-6">
			<Carousel
				opts={{
					skipSnaps: true,
					dragFree: true,
				}}
				className="w-full"
			>
				<div className="mb-4 flex flex-col gap-1">
					<div className="flex justify-between">
						<div className="flex items-end gap-3">
							<H2 className="capitalize">{t("achievements")}</H2>
							<TypographyMuted>
								{unlocked?.length}/{data.length}
							</TypographyMuted>
						</div>
						<div>
							<CarouselButton direction="left" />
							<CarouselButton direction="right" />
						</div>
					</div>
				</div>

				<CarouselContent className="-ml-2">
					{data.map((achievement) => {
						return (
							<CarouselItem key={achievement.name} className="basis-auto px-2">
								<AchievementCard {...achievement} />
							</CarouselItem>
						);
					})}
				</CarouselContent>
			</Carousel>
		</div>
	);
};

export default AchievementContainer;
