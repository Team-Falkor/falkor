import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/features/settings/hooks/useSettings";
import { useLanguageContext } from "@/i18n/I18N";
import { trpc } from "@/lib";
import { SettingsSection } from "../../section";
import SettingTitle from "../../title";
import SettingsContainer from "../container";
import AddAccountButton from "./addAccountButton";
import { AccountsDisplay } from "./display";

const AccountSettings = () => {
	const { t } = useLanguageContext();
	const { settings, updateSetting } = useSettings();
	const utils = trpc.useUtils();

	// 1. Fetch data in the parent component
	const { data: accounts, isPending } = trpc.accounts.getAll.useQuery();

	const useAccountsForDownloads = settings?.useAccountsForDownloads;

	// 2. Create the invalidation handler here
	const handleAccountAdded = async () => {
		await utils.accounts.getAll.invalidate();
	};

	return (
		<div>
			<SettingTitle>{t("settings.titles.accounts")}</SettingTitle>

			<SettingsContainer>
				<SettingsSection>
					<div className="flex gap-2">
						<div className="w-2/12">
							<AddAccountButton
								accounts={accounts ?? []}
								onAccountAdded={handleAccountAdded}
							/>
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
					{isPending ? (
						<div>Loading...</div>
					) : (
						// <AccountsTable data={accounts ?? []} />
						<AccountsDisplay accounts={accounts ?? []} />
					)}
				</SettingsSection>
			</SettingsContainer>
		</div>
	);
};

export default AccountSettings;
