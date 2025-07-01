import type { PluginSearchResponse } from "@team-falkor/shared-types";
import { ShoppingCart } from "lucide-react";
import type { DownloadgameData, RouterOutputs } from "@/@types";
import { cn } from "@/lib";
import { buttonVariants } from "../../ui/button";
import { Card } from "../../ui/card";
import { H3, P } from "../../ui/typography";
import { DownloadSourceContent } from "./downloadSourceContent";

type Deal =
	RouterOutputs["itad"]["pricesByName"]["prices"][number]["deals"][number];

type SourceCardProps = {
	source: PluginSearchResponse | Deal;
	pluginId?: string;
	game_data?: DownloadgameData;
	multiple_choice?: boolean;
	slug?: string;
	cacheStatus?: "checking" | "cached" | "not_cached" | "unsupported";
	isChecking?: boolean;
};

export const SourceCard = ({ source, ...props }: SourceCardProps) => {
	const isDeal = (item: SourceCardProps["source"]): item is Deal =>
		"price" in item && "shop" in item;

	return (
		<Card className="relative h-[7.5rem] w-full rounded-2xl border-none p-2.5">
			<div className="flex h-full w-full flex-col items-start justify-between">
				{isDeal(source) ? (
					<>
						<H3>{source.shop.name}</H3>
						<P className="-mt-0.5 w-full truncate text-muted-foreground">
							{source.url}
						</P>
						<a
							className={cn(
								buttonVariants({
									variant: "success",
								}),
								"w-full items-center gap-3 rounded-full font-bold",
							)}
							href={source.url}
							target="_blank"
							rel="noopener noreferrer"
						>
							<ShoppingCart size={18} fill="currentColor" />
							{source.price.currency} {source.price.amount}
						</a>
					</>
				) : (
					<DownloadSourceContent
						source={source}
						pluginId={props.pluginId}
						game_data={props.game_data}
						multiple_choice={props.multiple_choice}
						cacheStatus={props.cacheStatus}
						isChecking={props.isChecking}
					/>
				)}
			</div>
		</Card>
	);
};
