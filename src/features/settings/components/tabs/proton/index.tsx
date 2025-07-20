import { ProtonManager } from "@/features/proton/components";
import { useLanguageContext } from "@/i18n/I18N";
import { SettingsSection } from "../../section";
import SettingTitle from "../../title";
import SettingsContainer from "../container";

const ProtonSettings = () => {
	const { t } = useLanguageContext();

	return (
		<div>
			<SettingTitle>{t("settings.titles.Proton")}</SettingTitle>
			<SettingsContainer>
				<SettingsSection className="p-0">
					<ProtonManager />
				</SettingsSection>
			</SettingsContainer>
		</div>
	);
};

export default ProtonSettings;
