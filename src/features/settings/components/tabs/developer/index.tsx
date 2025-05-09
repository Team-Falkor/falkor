import { useLanguageContext } from "@/i18n/I18N";
import { SettingsSection } from "../../section";
import SettingTitle from "../../title";
import SettingsContainer from "../container";
import LogDisplay from "./settings/logDisplay";

const DeveloperSettings = () => {
	const { t } = useLanguageContext();

	return (
		<div>
			<SettingTitle>{t("settings.titles.developer")}</SettingTitle>

			<SettingsContainer>
				<SettingsSection>
					<LogDisplay />
				</SettingsSection>
			</SettingsContainer>
		</div>
	);
};

export default DeveloperSettings;
