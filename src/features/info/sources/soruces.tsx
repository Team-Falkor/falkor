import type { PluginSearchResponse } from "@team-falkor/shared-types";
import { useMemo } from "react";
import type { DownloadgameData, ItemDownload, RouterOutputs } from "@/@types";
import { SourceCard } from "@/components/cards/sourcecard";
import { CarouselItem } from "@/components/ui/carousel";

interface SourceShowcaseProps {
	sources: ItemDownload[];
	game_data: DownloadgameData;
	slug?: string;
}

const SourceShowcase = ({ sources, game_data, slug }: SourceShowcaseProps) => {
	const renderedSources = useMemo(() => {
		return sources?.flatMap((item) => {
			if (item.id === "itad") {
				if (!item.sources) return;
				return (
					item.sources as RouterOutputs["itad"]["pricesByName"]["prices"]
				)?.flatMap((source) =>
					source.deals?.map((deal, i) => (
						<CarouselItem
							key={`${item.id}-${i}`}
							className="relative overflow-hidden sm:basis-1/2 md:basis-1/2 2xl:basis-1/3"
						>
							<SourceCard source={deal} />
						</CarouselItem>
					)),
				);
			}

			return (item.sources as PluginSearchResponse[]).map((source, i) => (
				<CarouselItem
					key={`${item.id}-${i}`}
					className="relative overflow-hidden sm:basis-1/2 md:basis-1/2 2xl:basis-1/3"
				>
					<SourceCard
						source={source}
						pluginId={item.id}
						game_data={game_data}
						multiple_choice={item?.multiple_choice}
						slug={slug}
					/>
				</CarouselItem>
			));
		});
	}, [sources, game_data, slug]);

	return renderedSources;
};

export default SourceShowcase;
