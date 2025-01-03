import { InputWithIcon } from "@/components/inputWithIcon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLanguageContext } from "@/contexts/I18N";
import { Filter, Plus, SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { SettingsSection } from "../../section";
import SettingTitle from "../../title";
import SettingsContainer from "../container";
import AddPluginModal from "./addPluginModal";
import PluginDisplay from "./display";
import PluginsSort from "./sort";

export type SortBy = "alphabetic-asc" | "alphabetic-desc";

const PluginSettings = () => {
  const { t } = useLanguageContext();
  const [open, setOpen] = useState(false);

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
        {/* Search and Add Plugin Section */}
        <SettingsSection>
          <div className="flex items-center justify-between">
            <div className="flex w-full gap-4">
              {/* Search Input */}
              <InputWithIcon
                divClassName="w-1/3"
                placeholder={t("what_plugin_are_you_looking_for")}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                startIcon={<SearchIcon />}
              />

              {/* Add Plugin Button */}
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger>
                  <Tooltip>
                    <TooltipTrigger>
                      <Button className="gap-2">
                        <Plus />
                        {t("install_plugin")}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("install_plugin")}</TooltipContent>
                  </Tooltip>
                </DialogTrigger>
                <AddPluginModal setOpen={setOpen} open={open} />
              </Dialog>
            </div>

            {/* Sorting Options */}
            <PluginsSort
              showRows={showRows}
              setShowRows={setShowRows}
              sortBy={sortBy}
              setSortBy={setSortBy}
              showEnabledOnly={showEnabledOnly}
              setShowEnabledOnly={setShowEnabledOnly}
            />
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

      <div className="absolute p-3 rounded-full bottom-5 right-5 bg-muted">
        <Filter size={24} />
      </div>
    </div>
  );
};

export default PluginSettings;
