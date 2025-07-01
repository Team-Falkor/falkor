import type { PluginSearchResponse } from "@team-falkor/shared-types";
import {
	Activity,
	CheckCircle,
	CloudDownload,
	Loader,
	Save,
	Users,
	XCircle,
} from "lucide-react";
import type { DownloadgameData } from "@/@types";
import { useDownloadActions } from "@/hooks/use-download-actions";
import { useLanguageContext } from "@/i18n/I18N";
import { cn, formatBytes } from "@/lib";
import { Button } from "../../ui/button";
import { P } from "../../ui/typography";
import StatPill from "./statPill";

type DownloadSourceContentProps = {
	source: PluginSearchResponse;
	pluginId?: string;
	game_data?: DownloadgameData;
	multiple_choice?: boolean;
	cacheStatus?: "checking" | "cached" | "not_cached" | "unsupported";
	isChecking?: boolean;
};

export const DownloadSourceContent = ({
	source,
	pluginId,
	game_data,
	multiple_choice,
	cacheStatus,
	isChecking,
}: DownloadSourceContentProps) => {
	const { t } = useLanguageContext();
	const { addDownload } = useDownloadActions();

	const stats = {
		...(source?.size ? { size: formatBytes(source.size) } : {}),
		...("seeds" in source && !!source?.seeds ? { seeds: source.seeds } : {}),
		...("leechs" in source && !!source?.leechs
			? { leechs: source.leechs }
			: {}),
	};

	const isStatsAvailable = Object.keys(stats).length > 0;

	const getIconForStat = (stat: keyof typeof stats) => {
		switch (stat) {
			case "size":
				return Save;
			case "seeds":
				return Users;
			case "leechs":
				return Activity;
			default:
				return Save;
		}
	};

	const getCacheContent = () => {
		switch (cacheStatus) {
			case "checking":
				return {
					icon: Loader,
					text: "Checking...",
					iconClassName: "animate-spin",
				};
			case "cached":
				return {
					icon: CheckCircle,
					text: "Cached",
					iconClassName: "text-success",
				};
			case "not_cached":
				return {
					icon: XCircle,
					text: "Not Cached",
					iconClassName: "text-destructive",
				};
		}
	};

	const cacheContent = getCacheContent();

	return (
		<div className="flex size-full flex-col justify-between overflow-hidden">
			<div className="flex size-full flex-col justify-between overflow-hidden">
				<P
					className={cn("w-full", {
						"line-clamp-2": !isStatsAvailable,
						"line-clamp-1": isStatsAvailable,
						// "mb-0.5": isStatsAvailable,
					})}
				>
					{source.name}
				</P>
				{isStatsAvailable && (
					<div className="-mt-1 flex w-full flex-1 items-center justify-start gap-2 overflow-hidden truncate">
						{Object.keys(stats).map((stat) => {
							const statKey = stat as keyof typeof stats;
							return (
								<StatPill
									key={statKey}
									icon={getIconForStat(statKey)}
									value={stats[statKey]?.toString()}
								/>
							);
						})}
						{cacheStatus && cacheStatus !== "unsupported" && cacheContent && (
							<StatPill
								icon={cacheContent.icon}
								value={cacheContent.text}
								iconClassName={cacheContent.iconClassName}
							/>
						)}
					</div>
				)}
			</div>
			<Button
				className="w-full items-center gap-3 rounded-full font-bold capitalize"
				variant="success"
				disabled={isChecking}
				onClick={() => {
					addDownload({
						pluginId: pluginId,
						type: source.type === "ddl" ? "http" : "torrent",
						url: source.return,
						multiple_choice: multiple_choice,
						game_data: game_data,
						name: source.name,
						autoStart: true,
					});
				}}
			>
				{cacheStatus === "checking" ? (
					<Loader className="size-4 animate-spin" />
				) : (
					<CloudDownload size={18} fill="currentColor" className="shrink-0" />
				)}
				<P className="max-w-full truncate capitalize">
					{source?.uploader ?? t("download")}
				</P>
			</Button>
		</div>
	);
};
