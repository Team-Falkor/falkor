import { Loader2, PlayIcon } from "lucide-react";
import { Sound } from "@/@types";
import { Button } from "@/components/ui/button";
import { useLanguageContext } from "@/i18n/I18N";
import { trpc } from "@/lib";
import { SettingsSection } from "../../section";
import SettingTitle from "../../title";
import SettingsContainer from "../container";
import LogDisplay from "./settings/logDisplay";

const sounds = Object.values(Sound);

const DeveloperSettings = () => {
	const { t } = useLanguageContext();

	const testSound = trpc.app.testSound.useMutation();

	return (
		<div>
			<SettingTitle>{t("settings.titles.Developer")}</SettingTitle>

			<SettingsContainer>
				<SettingsSection>
					<LogDisplay />
				</SettingsSection>

				<SettingsSection title="test_sounds">
					<div className="flex gap-4">
						{sounds.map((sound) => (
							<Button
								key={sound}
								disabled={testSound.isPending}
								onClick={async () =>
									testSound.mutate({
										sound,
									})
								}
								variant="functional"
							>
								{!testSound.isPending ? (
									<PlayIcon />
								) : (
									<Loader2 className="animate-spin" />
								)}
								{sound}
							</Button>
						))}
					</div>
				</SettingsSection>
			</SettingsContainer>
		</div>
	);
};

export default DeveloperSettings;
