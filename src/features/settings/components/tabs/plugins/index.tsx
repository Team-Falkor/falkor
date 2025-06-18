import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { H1, TypographyMuted } from "@/components/ui/typography";
import { CommunityProviders } from "@/features/plugins/providers/components/community-providers";
import { usePluginsProviders } from "@/features/plugins/providers/hooks/usePluginsProviders";
import { useLanguageContext } from "@/i18n/I18N";
import { SettingsSection } from "../../section";
import SettingTitle from "../../title";
import SettingsContainer from "../container";
import PluginAddButton from "./addButton";
import PluginDisplay from "./display";
import PluginSearch from "./search";
import PluginsSort, { type SortBy } from "./sort";

const PluginSettings = () => {
	const { t } = useLanguageContext();
	const [open, setOpen] = useState(false);
	const [isSearchExpanded, setIsSearchExpanded] = useState(false);
	const [showRows, setShowRows] = useState<boolean>(false);
	const [sortBy, setSortBy] = useState<SortBy>("alphabetic-asc");
	const [search, setSearch] = useState("");
	const { changeEnabledOnly, enabledOnly } = usePluginsProviders();

	useEffect(() => {
		setShowRows(localStorage?.getItem("showRows") === "true");
		setSortBy((localStorage?.getItem("sortBy") as SortBy) || "alphabetic-asc");
	}, []);

	return (
		<div className="relative h-[calc(100vh-3rem)] w-full">
			<SettingTitle>{t("settings.titles.plugins")}</SettingTitle>

			<Tabs defaultValue="installed" className="h-full">
				<SettingsContainer>
					<div className="mb-6 flex flex-col gap-6">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="installed">Installed</TabsTrigger>
							<TabsTrigger value="community">Community</TabsTrigger>
						</TabsList>

						<div className="flex items-end justify-between gap-4 rounded-xl bg-muted/30 p-3.5">
							<PluginSearch
								isSearchExpanded={isSearchExpanded}
								setIsSearchExpanded={setIsSearchExpanded}
								search={search}
								setSearch={setSearch}
							/>

							<div className="flex items-center gap-2">
								<PluginsSort
									showRows={showRows}
									setShowRows={setShowRows}
									sortBy={sortBy}
									setSortBy={setSortBy}
									showEnabledOnly={enabledOnly}
									changeEnabledOnly={changeEnabledOnly}
								/>
								<PluginAddButton open={open} setOpen={setOpen} />
							</div>
						</div>
					</div>

					<TabsContent value="installed" className="space-y-4">
						<SettingsSection className="min-h-[200px] flex-grow">
							<PluginDisplay
								showRows={showRows}
								setShowRows={setShowRows}
								sortBy={sortBy}
								showEnabledOnly={enabledOnly}
								search={search}
							/>
						</SettingsSection>
					</TabsContent>

					<TabsContent value="community" className="space-y-4">
						<SettingsSection className="flex flex-col items-center justify-center p-8 text-center">
							<H1 className="mb-2">{t("settings.plugins.community_title")}</H1>
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
		</div>
	);
};

export default PluginSettings;
