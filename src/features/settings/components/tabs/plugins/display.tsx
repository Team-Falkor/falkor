import { PluginSetupJSONDisabled } from "@/@types";
import UnifiedPluginCard from "@/components/cards/unified-plugin-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import UsePlugins from "@/hooks/usePlugins";
import { cn } from "@/lib";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { SortBy } from "./sort";
import { H5 } from "@/components/ui/typography";

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
  const { getPlugins, needsUpdate } = UsePlugins();

  const { data, isPending, error } = useQuery({
    queryKey: ["plugins", "all"],
    queryFn: async () => {
      const plugins = await getPlugins(true);

      return plugins?.data;
    },
  });

  const onSearch = useCallback(
    (search: string, toSearch?: PluginSetupJSONDisabled[] | null) => {
      const realData = toSearch ?? data;
      if (!search) return realData;
      return realData?.filter(
        (plugin) =>
          plugin?.name?.toLowerCase()?.includes(search?.toLowerCase()) ||
          plugin?.id?.toLowerCase()?.includes(search?.toLowerCase())
      );
    },
    [data]
  );

  const sortedPlugins = useMemo(() => {
    let sorted = data;
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
  }, [data, onSearch, search, showEnabledOnly, sortBy]);

  if (isPending) return <div>Loading...</div>;
  if (error) return <div>Error</div>;

  if (!data) return null;

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
              needsUpdate={!!needsUpdate?.get(plugin.id)}
            />
          ))
        ) : (
          <div className="flex items-center justify-start w-full py-2">
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
