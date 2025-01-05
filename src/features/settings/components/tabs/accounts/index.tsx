import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLanguageContext } from "@/contexts/I18N";
import AccountsTable from "@/features/accounts/components/table";
import { useSettings } from "@/hooks";
import { SettingsSection } from "../../section";
import SettingTitle from "../../title";
import SettingsContainer from "../container";
import AddAccountButton from "./addAccountButton";

const AccountSettings = () => {
  const { t } = useLanguageContext();
  const { settings, updateSetting } = useSettings();

  return (
    <div>
      <SettingTitle>{t("settings.titles.accounts")}</SettingTitle>

      <SettingsContainer>
        <SettingsSection>
          <div className="flex gap-2">
            <div className="w-2/12">
              <AddAccountButton />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="use-accounts-for-downloads"
                checked={settings.useAccountsForDownloads}
                onCheckedChange={() =>
                  updateSetting(
                    "useAccountsForDownloads",
                    !settings.useAccountsForDownloads
                  )
                }
              />
              <Label htmlFor="use-accounts-for-downloads">
                {t("settings.settings.use-accounts-to-download")}
              </Label>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection>
          <AccountsTable />
        </SettingsSection>
      </SettingsContainer>
    </div>
  );
};

export default AccountSettings;
