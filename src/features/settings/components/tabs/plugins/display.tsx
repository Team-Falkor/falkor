import type { PluginSetupJSONDisabled } from "@team-falkor/shared-types";
import { useCallback, useMemo } from "react";
import UnifiedPluginCard from "@/components/cards/unified-plugin-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { H5 } from "@/components/ui/typography";
import { usePluginsProviders } from "@/features/plugins/providers/hooks/usePluginsProviders";
import { cn } from "@/lib";
import type { SortBy } from "./sort";

interface Props {
	showRows: boolean;
	setShowRows: (showRows: boolean) => void;

	sortBy: SortBy;
	showEnabledOnly: boolean;
	search: string;
}

const PluginDisplay = ({
	showRows,
	sortBy,
	showEnabledOnly,
	search,
}: Props) => {
	const {
		getPlugins,
		needsUpdate,
		plugins,
		isErrorPlugins,
		errorPlugins,
		isLoadingPlugins,
	} = usePluginsProviders();

	const onSearch = useCallback(
		(search: string, toSearch?: PluginSetupJSONDisabled[] | null) => {
			const realData = toSearch ?? plugins;
			if (!search) return realData;
			return realData?.filter(
				(plugin) =>
					plugin?.name?.toLowerCase()?.includes(search?.toLowerCase()) ||
					plugin?.id?.toLowerCase()?.includes(search?.toLowerCase()),
			);
		},
		[plugins],
	);

	const sortedPlugins = useMemo(() => {
		let sorted = plugins;
		if (showEnabledOnly) {
			sorted = sorted?.filter((plugin) => !plugin?.disabled);
		}

		if (sortBy === "alphabetic-asc") {
			sorted = sorted?.sort((a, b) => a?.name?.localeCompare(b?.name));
		} else if (sortBy === "alphabetic-desc") {
			sorted = sorted?.sort((a, b) => b?.name?.localeCompare(a?.name));
		}

		if (search?.length > 0) {
			sorted = onSearch(search, sorted);
		}
		return sorted;
	}, [plugins, onSearch, search, showEnabledOnly, sortBy]);

	if (isLoadingPlugins) return <div>Loading...</div>;
	if (isErrorPlugins) {
		console.error(errorPlugins);
		return <div>Error</div>;
	}

	if (!plugins) return null;

	return (
		<ScrollArea className="w-full">
			<div
				className={cn([
					{
						"grid grid-cols-2 gap-4": showRows,
						"grid grid-cols-1 gap-4": !showRows,
						flex: !sortedPlugins?.length,
					},
				])}
			>
				{sortedPlugins?.length ? (
					sortedPlugins?.map((plugin: PluginSetupJSONDisabled) => (
						<UnifiedPluginCard
							key={plugin.id}
							id={plugin.id}
							name={plugin.name}
							description={plugin.description}
							version={plugin.version}
							image={plugin.logo}
							banner={plugin.banner}
							isInstalled={true}
							disabled={plugin.disabled}
							author={plugin.author}
							needsUpdate={!!needsUpdate?.find((plugin) => plugin.id)}
						/>
					))
				) : (
					<div className="flex w-full items-center justify-start py-2">
						<H5 className="w-full text-left">
							{search?.length ? `No results for "${search}"` : "No plugins"}
						</H5>
					</div>
				)}
			</div>
		</ScrollArea>
	);
};

export default PluginDisplay;
