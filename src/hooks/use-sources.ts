import { useMemo, useState } from "react";
import type { InfoItadProps, ItemDownload, SourceProvider } from "@/@types";
import { usePluginsProviders } from "@/features/plugins/providers/hooks/usePluginsProviders";
import { normalizeName } from "@/lib";

export function useSources(title: string, itadData: InfoItadProps["itadData"]) {
	const [selectedProvider, setSelectedProvider] = useState<SourceProvider>({
		value: "all",
		label: "All",
	});

	const { searchAllPlugins } = usePluginsProviders();
	const { data: pluginResult, isError } = searchAllPlugins(
		normalizeName(title),
	);

	// Compose all sources in one memo
	const { allSources, providers, filteredSources } = useMemo(() => {
		// 1) Base ITAD source
		const itad: ItemDownload = {
			id: "itad",
			name: "IsThereAnyDeal",
			sources: itadData?.prices ?? [],
		};

		// 2) Plugin sources (fall back to empty array)
		const plugins = pluginResult?.data ?? [];

		// 3) Combine
		const combined = [itad, ...plugins];

		// 4) Build provider list
		const validProviders = combined
			.filter((src) => src.sources.length > 0)
			.map((src) => ({
				value: src.id ?? "unknown",
				label: src.name ?? "Unknown",
			}))
			.filter((prov) => prov.value !== "unknown");

		const providersList = [{ value: "all", label: "All" }, ...validProviders];

		// 5) Filtered sources based on selection
		const filtered =
			selectedProvider.value === "all"
				? combined
				: combined.filter((src) =>
						src.id?.toLowerCase().includes(selectedProvider.value),
					);

		return {
			allSources: combined,
			providers: providersList,
			filteredSources: filtered,
		};
	}, [itadData, pluginResult, selectedProvider]);

	return {
		providers,
		filteredSources,
		isError,
		selectedProvider,
		setSelectedProvider,
	};
}
