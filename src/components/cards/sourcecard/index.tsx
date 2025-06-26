import type { PluginSearchResponse } from "@team-falkor/shared-types";
import { CloudDownload, Save, ShoppingCart, Users } from "lucide-react";
import type { DownloadgameData, RouterOutputs } from "@/@types";
import { useDownloadActions } from "@/hooks/use-download-actions";
import { useLanguageContext } from "@/i18n/I18N";
import { cn, formatBytes } from "@/lib";
import { Button, buttonVariants } from "../../ui/button";
import { Card } from "../../ui/card";
import { H3, P } from "../../ui/typography";
import StatPill from "./statPill";

type Deal =
	RouterOutputs["itad"]["pricesByName"]["prices"][number]["deals"][number];

type SourceCardProps = {
	source: PluginSearchResponse | Deal;
	pluginId?: string;
	game_data?: DownloadgameData;
	multiple_choice?: boolean;
	slug?: string;
};

export const SourceCard = ({ source, ...props }: SourceCardProps) => {
	const { t } = useLanguageContext();
	const { addDownload } = useDownloadActions();
	// const { settings } = useSettings();

	const isDeal = (item: SourceCardProps["source"]): item is Deal =>
		"price" in item && "shop" in item;

	return (
		<Card className="relative h-28 w-full rounded-2xl border-none p-2.5">
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
					<>
						<div className="-top-4 absolute left-2">
							{!!source?.size && (
								<StatPill icon={Save} value={formatBytes(source.size)} />
							)}

							{"seeds" in source && !!source?.seeds && (
								<StatPill icon={Users} value={source.seeds} />
							)}
						</div>
						<P className="line-clamp-2 w-full">{source.name}</P>
						<Button
							className="w-full items-center gap-3 rounded-full font-bold capitalize"
							variant="success"
							onClick={() => {
								addDownload({
									pluginId: props.pluginId,
									type: source.type === "ddl" ? "http" : "torrent",
									url: source.return,
									multiple_choice: props.multiple_choice,
									game_data: props.game_data,
									name: source.name,
									autoStart: true,
								});
							}}
						>
							<CloudDownload
								size={18}
								fill="currentColor"
								className="shrink-0"
							/>
							<P className="max-w-full truncate capitalize">
								{source?.uploader ?? t("download")}
							</P>
						</Button>
					</>
				)}
			</div>
		</Card>
	);
};
