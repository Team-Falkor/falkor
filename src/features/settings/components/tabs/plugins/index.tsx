import { useLanguageContext } from "@/contexts/I18N";
import { useEffect, useState } from "react";
import { SettingsSection } from "../../section";
import SettingTitle from "../../title";
import SettingsContainer from "../container";
import PluginDisplay from "./display";
import PluginsSort, { SortBy } from "./sort";
import { cn } from "@/lib";
import PluginAddButton from "./addButton";
import PluginSearch from "./search";

const PluginSettings = () => {
  const { t } = useLanguageContext();
  const [open, setOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [showRows, setShowRows] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<SortBy>("alphabetic-asc");
  const [showEnabledOnly, setShowEnabledOnly] = useState<boolean>(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setShowRows(localStorage?.getItem("showRows") === "true");
    setSortBy((localStorage?.getItem("sortBy") as SortBy) || "alphabetic-asc");
    setShowEnabledOnly(localStorage?.getItem("showEnabledOnly") === "true");
    
 
    

  }, []);

  return (
    <div className="relative w-full h-[calc(100vh-3rem)]">
      <SettingTitle>{t("settings.titles.plugins")}</SettingTitle>

      <SettingsContainer>
        {/* Search and Controls Section */}
        <SettingsSection>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Collapsible Search Input */}
              <PluginSearch 
                isSearchExpanded={isSearchExpanded}
                setIsSearchExpanded={setIsSearchExpanded}
                search={search}
                setSearch={setSearch}
              />

              {/* Add Plugin Button Component */}
              <PluginAddButton 
                open={open} 
                setOpen={setOpen} 
              />
            </div>

            {/* Sorting Options */}
            <div className={cn("transition-all duration-300", )}>
              <PluginsSort
                showRows={showRows}
                setShowRows={setShowRows}
                sortBy={sortBy}
                setSortBy={setSortBy}
                showEnabledOnly={showEnabledOnly}
                setShowEnabledOnly={setShowEnabledOnly}
              />
            </div>
          </div>
        </SettingsSection>

        {/* Plugin Display Section */}
        <SettingsSection>
          <PluginDisplay
            showRows={showRows}
            setShowRows={setShowRows}
            sortBy={sortBy}
            showEnabledOnly={showEnabledOnly}
            search={search}
          />
        </SettingsSection>
      </SettingsContainer>

      {/* <div className="absolute p-3 rounded-full bottom-5 right-5 bg-muted">
        <Filter size={24} />
      </div> */}
    </div>
  );
};

export default PluginSettings;
