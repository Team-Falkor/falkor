import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/features/settings/hooks/useSettings";
import { useLanguageContext } from "@/i18n/I18N";
import { SettingsSection } from "../../section";
import { SettingsItem } from "../../settingsItem";
import SettingTitle from "../../title";
import SettingsContainer from "../container";
import { ChangeApiUrl } from "./settings/change-api-url";
import LanguageDropdown from "./settings/language";
import TitleBarDropdown from "./settings/title-bar";

const GeneralSetting = () => {
	const { t } = useLanguageContext();
	const { settings, updateSetting, isUpdating } = useSettings();

	return (
		<div>
			<SettingTitle>{t("settings.titles.general")}</SettingTitle>

			<SettingsContainer>
				<SettingsSection title="update_settings">
					<SettingsItem title="change-api-url">
						<ChangeApiUrl />
					</SettingsItem>

					<SettingsItem title="check-for-plugin-updates-on-startup">
						<Switch
							id="check-for-plugin-updates-on-startup"
							checked={!!settings?.checkForPluginUpdatesOnStartup}
							disabled={isUpdating}
							onCheckedChange={async (checked: boolean) =>
								await updateSetting(
									{ path: "checkForPluginUpdatesOnStartup", value: checked },
									{ onSuccess: () => console.log("updated!") },
								)
							}
						/>
					</SettingsItem>

					<SettingsItem title="check-for-app-updates-on-startup">
						<Switch
							id="check-for-app-updates-on-startup"
							checked={!!settings?.checkForUpdatesOnStartup}
							disabled={isUpdating}
							onCheckedChange={(checked: boolean) =>
								updateSetting({
									path: "checkForUpdatesOnStartup",
									value: checked,
								})
							}
						/>
					</SettingsItem>
				</SettingsSection>

				<SettingsSection title="app-settings">
					{/* <SettingsItem title="launch-on-startup">
            <Switch
              id="launch-on-startup"
              checked={
                settings?.launchOnStartup === "minimized" ||
                settings?.launchOnStartup === true
              }
              onCheckedChange={async () => {
                const autoLaunch = await invoke<boolean, AutoLaunchOptions>(
                  "app:auto-launch",
                  {
                    enabled: !settings.launchOnStartup,
                    isHidden: settings.launchOnStartup === "minimized",
                  }
                );

                if (!autoLaunch) {
                  toast.error("Failed to configure auto launch");
                  return;
                }

                await updateSetting(
                  "launchOnStartup",
                  settings?.launchOnStartup ? false : true
                );
              }}
            /> */}
					{/* </SettingsItem> */}

					{/* <SettingsItem title="launch-on-startup-minimized">
            <Switch
              disabled={!settings?.launchOnStartup}
              id="launch-on-startup-minimized"
              checked={!!(settings && settings.launchOnStartup === "minimized")}
              onCheckedChange={async (checked) => {
                const autoLaunch = await invoke<boolean, AutoLaunchOptions>(
                  "app:auto-launch",
                  {
                    enabled: true,
                    isHidden: checked ? true : false,
                  }
                );

                if (!autoLaunch) {
                  toast.error("Failed to configure auto launch");
                  return;
                }

                await updateSetting(
                  "launchOnStartup",
                  settings?.launchOnStartup ? "minimized" : true
                );
              }}
            />
          </SettingsItem> */}

					<SettingsItem title="close-to-tray">
						<Switch
							id="close-to-tray"
							checked={!!settings?.closeToTray}
							onCheckedChange={() =>
								!settings
									? null
									: updateSetting({
											path: "closeToTray",
											value: !settings.closeToTray,
										})
							}
						/>
					</SettingsItem>

					<SettingsItem title="toggle-notifications">
						<Switch
							id="toggle-notifications"
							checked={!!settings?.notifications}
							onCheckedChange={() =>
								!settings
									? null
									: updateSetting({
											path: "notifications",
											value: !settings.notifications,
										})
							}
						/>
					</SettingsItem>
				</SettingsSection>

				<SettingsSection
					title="change-title-bar-style"
					description="change_title_bar_style_description"
				>
					<SettingsItem title="title-bar-style">
						<div className="w-64">
							<TitleBarDropdown />
						</div>
					</SettingsItem>
				</SettingsSection>

				<SettingsSection title="change_language">
					<SettingsItem title="language">
						<div className="w-64">
							<LanguageDropdown />
						</div>
					</SettingsItem>
				</SettingsSection>
			</SettingsContainer>
		</div>
	);
};

export default GeneralSetting;
