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
		needsUpdate,
		plugins,
		isErrorPlugins,
		errorPlugins,
		isLoadingPlugins,
	} = usePluginsProviders();

	const onSearch = useCallback(
		(searchQuery: string, toSearch?: PluginSetupJSONDisabled[] | null) => {
			const realData = toSearch ?? plugins;
			if (!searchQuery) return realData;
			return realData?.filter(
				(plugin) =>
					plugin?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
					plugin?.id?.toLowerCase()?.includes(searchQuery?.toLowerCase()),
			);
		},
		[plugins],
	);

	const filteredAndSortedPlugins = useMemo(() => {
		let filtered = plugins;

		if (showEnabledOnly && filtered) {
			filtered = filtered.filter((plugin) => !plugin.disabled);
		}

		if (sortBy === "alphabetic-asc") {
			filtered = filtered?.sort((a, b) => a?.name?.localeCompare(b?.name));
		} else if (sortBy === "alphabetic-desc") {
			filtered = filtered?.sort((a, b) => b?.name?.localeCompare(a?.name));
		}

		if (search?.length > 0) {
			filtered = onSearch(search, filtered);
		}

		return filtered;
	}, [onSearch, plugins, search, sortBy, showEnabledOnly]);

	if (isLoadingPlugins) {
		return (
			<div className="p-4 text-center text-muted-foreground">
				Loading plugins...
			</div>
		);
	}
	if (isErrorPlugins) {
		console.error(errorPlugins);
		return (
			<div className="p-4 text-center text-destructive">
				Error loading plugins. Please try again.
			</div>
		);
	}

	if (!plugins || filteredAndSortedPlugins?.length === 0) {
		return (
			<div className="flex w-full items-center justify-center p-4">
				<H5 className="text-muted-foreground">
					{search?.length
						? `No results for "${search}"`
						: "No plugins installed."}
				</H5>
			</div>
		);
	}

	return (
		<ScrollArea className="h-full w-full">
			<div
				className={cn("grid gap-4", showRows ? "grid-cols-2" : "grid-cols-1")}
			>
				{filteredAndSortedPlugins?.map((plugin: PluginSetupJSONDisabled) => (
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
						needsUpdate={
							!!needsUpdate?.find(
								(updatePlugin) => updatePlugin.id === plugin.id,
							)
						}
					/>
				))}
			</div>
		</ScrollArea>
	);
};

export default PluginDisplay;
