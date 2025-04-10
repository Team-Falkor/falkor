import { H1 } from "@/components/typography/h1";
import { TypographyMuted } from "@/components/typography/muted";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguageContext } from "@/contexts/I18N";
import { CommunityProviders } from "@/features/plugins/providers/components/community-providers";
import { cn } from "@/lib";
import { useEffect, useState } from "react";
import { SettingsSection } from "../../section";
import SettingTitle from "../../title";
import SettingsContainer from "../container";
import PluginAddButton from "./addButton";
import PluginDisplay from "./display";
import PluginSearch from "./search";
import PluginsSort, { SortBy } from "./sort";

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

      {/* TODO: move each tab to its own component to clean up this file */}
      <Tabs defaultValue="installed">
        <SettingsContainer>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="installed">Installed</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
          </TabsList>

          {/* Search and Controls Section */}
          <TabsContent value="installed">
            <div className="flex flex-col gap-4">
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
                    <PluginAddButton open={open} setOpen={setOpen} />
                  </div>

                  {/* Sorting Options */}
                  <div className={cn("transition-all duration-300")}>
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
            </div>
          </TabsContent>

          <TabsContent value="community" className="flex flex-col gap-4">
            <SettingsSection className="justify-center items-center flex flex-col w-full">
              <H1>{t("settings.plugins.community_title")}</H1>
              <TypographyMuted>
                {t("settings.plugins.community_disclaimer")}
              </TypographyMuted>
            </SettingsSection>

            <SettingsSection>
              <CommunityProviders />
            </SettingsSection>
          </TabsContent>
        </SettingsContainer>
      </Tabs>

      {/* TODO: Create filter button that opens dropdown-menu to filter out installed, change row type, and sort instead of having them next to the search bar */}
      {/* <div className="absolute p-3 rounded-full bottom-5 right-5 bg-muted">
        <FilterIcon size={24} />
      </div> */}
    </div>
  );
};

export default PluginSettings;
