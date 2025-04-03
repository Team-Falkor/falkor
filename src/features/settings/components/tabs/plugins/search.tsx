import { InputWithIcon } from "@/components/inputWithIcon";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguageContext } from "@/contexts/I18N";
import { SearchIcon } from "lucide-react";
import { useEffect, useRef } from "react";

interface PluginSearchProps {
  isSearchExpanded: boolean;
  setIsSearchExpanded: (expanded: boolean) => void;
  search: string;
  setSearch: (search: string) => void;
}

const PluginSearch = ({
  isSearchExpanded,
  setIsSearchExpanded,
  search,
  setSearch,
}: PluginSearchProps) => {
  const { t } = useLanguageContext();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  const handleSearchToggle = () => {
    const newExpandedState = !isSearchExpanded;
    setIsSearchExpanded(newExpandedState);
    if (!newExpandedState) {
      setSearch("");
    }
  };

  return (
    <div className="relative">
      <div
        className={`
          absolute left-0 top-0
          transition-all duration-300 ease-in-out
          ${isSearchExpanded ? 'w-64 opacity-100 pointer-events-auto' : 'w-10 opacity-0 pointer-events-none'}
        `}
      >
        <InputWithIcon
          ref={searchInputRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("what_plugin_are_you_looking_for")}
          startIcon={<SearchIcon className="h-4 w-4" />}
          className="w-full"
          onBlur={() => {
            if (!search) {
              setIsSearchExpanded(false);
            }
          }}
        />
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSearchToggle}
            className={`
              relative z-10
              transition-all duration-300 ease-in-out
              ${isSearchExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}
            `}
          >
            <SearchIcon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t("search_plugins")}</TooltipContent>
      </Tooltip>
    </div>
  );
};

export default PluginSearch;