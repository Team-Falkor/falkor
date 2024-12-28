import { Input } from "@/components/ui/input";
import { PopoverContent } from "@/components/ui/popover";
import useSearch from "@/features/search/hooks/useSearch";
import { cn, getSteamIdFromWebsites } from "@/lib";
import { IGDBReturnDataType } from "@/lib/api/igdb/types";
import { t } from "i18next";
import { ShipWheel } from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { NewGameFormSchema } from "./schema";

interface NewGameImportProps {
  form: UseFormReturn<NewGameFormSchema>;
  setPopoverOpen: Dispatch<SetStateAction<boolean>>;
}

const replaceUrl = (url?: string): string => {
  if (!url) return "";
  if (url.startsWith("//")) return `https:${url}`;
  return "";
};

const NewGameImport = ({ form, setPopoverOpen }: NewGameImportProps) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { results, loading } = useSearch(searchTerm, 5);

  const handleClick = (game: IGDBReturnDataType) => {
    const steam_id = getSteamIdFromWebsites(game.websites);
    form.setValue("gameName", game.name);
    form.setValue("igdbId", game.id.toString());
    form.setValue(
      "gameIcon",
      replaceUrl(game.screenshots?.[0]?.url ?? game.cover?.url)
    );
    form.setValue("gameId", game.id.toString());
    form.setValue("steamId", steam_id);

    setPopoverOpen(false);
  };

  return (
    <PopoverContent side="top" className="p-0 w-96">
      <div className="grid gap-4">
        <div className="w-full px-4 pt-4">
          <Input
            placeholder={t("search_placeholder")}
            className="w-full"
            onChange={(e) => setSearchTerm(e.target.value)}
            value={searchTerm}
          />
        </div>

        <div className="grid w-full p-2 -mt-2">
          {loading ? (
            <div className="flex items-center justify-center px-4 text-center py-14 sm:px-14">
              <ShipWheel className="mr-2 h-9 w-9 animate-spin stroke-primary text-primary" />
            </div>
          ) : !loading && !!results?.length ? (
            results.map((game, i) => (
              <div
                key={game.id}
                className={cn(
                  "w-full px-6 py-3 border-b rounded-md cursor-default select-none hover:cursor-pointer hover:text-white",
                  {
                    "border-none": i === results.length - 1,
                  }
                )}
                onClick={() => handleClick(game)}
              >
                <div className="flex gap-1.5">
                  <p className="flex-1 text-sm line-clamp-2">{game?.name}</p>
                  <span className="text-xs text-muted-foreground">
                    ({game?.release_dates?.[0]?.human})
                  </span>
                </div>
              </div>
            ))
          ) : null}
        </div>
      </div>
    </PopoverContent>
  );
};

export default NewGameImport;
