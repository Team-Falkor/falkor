import { Button } from "@/components/ui/button";
import { useLanguageContext } from "@/contexts/I18N";
import { SettingsSection } from "../section";
import { SettingsItem } from "../settingsItem";
import SettingTitle from "../title";
import SettingsContainer from "./container";

const MiscellaneousSettings = () => {
  const { t } = useLanguageContext();

  const handleResetCache = async () => {
    console.log("Resetting IGDB cache");
    localStorage.removeItem("igdb_access_token");
    localStorage.removeItem("igdb_token_expiration");

    window.location.reload();
  };

  return (
    <div>
      <SettingTitle>{t("settings.titles.miscellaneous")}</SettingTitle>

      <SettingsContainer>
        <SettingsSection title="reset-igdb-cache">
          <SettingsItem title="reset-igdb-cache">
            <Button variant="secondary" onClick={handleResetCache}>
              {t("settings.settings.reset-igdb-cache")}
            </Button>
          </SettingsItem>
        </SettingsSection>
      </SettingsContainer>
    </div>
  );
};

export default MiscellaneousSettings;
