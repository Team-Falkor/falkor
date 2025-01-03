import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLanguageContext } from "@/contexts/I18N";
import { ArrowDownAZ, ArrowUpAZ, Check, Columns2, Rows3 } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { SortBy } from ".";

interface PluginsSortProps {
  showRows: boolean;
  setShowRows: (showRows: boolean) => void;
  sortBy: SortBy;
  setSortBy: Dispatch<SetStateAction<SortBy>>;

  setShowEnabledOnly: Dispatch<SetStateAction<boolean>>;
  showEnabledOnly: boolean;
}

const PluginsSort = ({
  setShowRows,
  showRows,
  setSortBy,
  sortBy,
  setShowEnabledOnly,
  showEnabledOnly,
}: PluginsSortProps) => {
  const { t } = useLanguageContext();

  return (
    <div className="flex gap-2">
      <Tooltip>
        <TooltipTrigger>
          <Button
            variant={showEnabledOnly ? "default" : "ghost"}
            size={"icon"}
            onClick={() => {
              localStorage.setItem("showEnabledOnly", String(!showEnabledOnly));
              setShowEnabledOnly(!showEnabledOnly);
            }}
          >
            <Check />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="capitalize">
          {!showEnabledOnly ? t("enabled_only") : t("all_plugins")}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger>
          <Button
            variant={"ghost"}
            size={"icon"}
            onClick={() => {
              const newSortBy =
                sortBy === "alphabetic-asc"
                  ? "alphabetic-desc"
                  : "alphabetic-asc";
              localStorage.setItem("sortBy", newSortBy);
              setSortBy(newSortBy);
            }}
          >
            {sortBy === "alphabetic-asc" ? <ArrowUpAZ /> : <ArrowDownAZ />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {sortBy === "alphabetic-asc"
            ? t("sort_alphabeticly_asc")
            : t("sort_alphabeticly_desc")}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger>
          <Button
            variant={"ghost"}
            size={"icon"}
            onClick={() => {
              localStorage.setItem("showRows", String(!showRows));
              setShowRows(!showRows);
            }}
          >
            {showRows ? <Columns2 /> : <Rows3 />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {showRows ? t("show_list") : t("show_grid")}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default PluginsSort;
