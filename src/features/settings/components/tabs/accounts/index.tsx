import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import AccountsTable from "@/features/accounts/components/table";
import { useSettings } from "@/features/settings/hooks/useSettings";
import { useLanguageContext } from "@/i18n/I18N";
import { SettingsSection } from "../../section";
import SettingTitle from "../../title";
import SettingsContainer from "../container";
import AddAccountButton from "./addAccountButton";

const AccountSettings = () => {
	const { t } = useLanguageContext();
	const { settings, updateSetting } = useSettings();

	const useAccountsForDownloads = settings?.useAccountsForDownloads;

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
								checked={useAccountsForDownloads}
								onCheckedChange={() =>
									updateSetting({
										path: "useAccountsForDownloads",
										value: !useAccountsForDownloads,
									})
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
