import type { PluginSearchResponse } from "@team-falkor/shared-types";
import { useMemo } from "react";
import type { DownloadgameData, ItemDownload, RouterOutputs } from "@/@types";
import { SourceCard } from "@/components/cards/sourcecard";
import { CarouselItem } from "@/components/ui/carousel";
import { useCacheStatuses } from "@/hooks/useCacheStatuses";
import { trpc } from "@/lib";

interface SourceShowcaseProps {
	sources: ItemDownload[];
	game_data: DownloadgameData;
	slug?: string;
}

const SourceShowcase = ({ sources, game_data, slug }: SourceShowcaseProps) => {
	const { data: accounts } = trpc.accounts.getAll.useQuery();
	const torboxAccount = accounts?.find((acc) => acc.type === "torbox");

	const allSources = useMemo(
		() =>
			sources
				.filter((item) => item.id !== "itad")
				.flatMap((item) => item.sources as PluginSearchResponse[]),
		[sources],
	);

	const { cacheStatuses, hasAnyAccount, isChecking } = useCacheStatuses(
		allSources,
		torboxAccount?.accessToken
			? { accessToken: torboxAccount.accessToken }
			: undefined,
	);

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
					className="relative overflow-y-visible sm:basis-1/2 md:basis-1/2 2xl:basis-1/3"
				>
					<SourceCard
						source={source}
						pluginId={item.id}
						game_data={game_data}
						multiple_choice={item?.multiple_choice}
						slug={slug}
						cacheStatus={
							hasAnyAccount
								? (cacheStatuses[source.return] ?? "checking")
								: undefined
						}
						isChecking={isChecking}
					/>
				</CarouselItem>
			));
		});
	}, [sources, game_data, slug, cacheStatuses, hasAnyAccount, isChecking]);

	return renderedSources;
};

export default SourceShowcase;
