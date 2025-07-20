import {
	Blocks,
	Code2,
	Cog,
	FileCog2,
	Layers,
	Settings2,
	UserCog,
} from "lucide-react";
import { type ComponentType, lazy, type ReactElement, useState } from "react";
import { trpc } from "@/lib";

const GeneralSettings = lazy(() => import("../components/tabs/general"));
const DownloadSettings = lazy(() => import("../components/tabs/download"));
const PluginSettings = lazy(() => import("../components/tabs/plugins"));
const AccountSettings = lazy(() => import("../components/tabs/accounts"));
const MiscellaneousSettings = lazy(
	() => import("../components/tabs/miscellaneous"),
);
const DeveloperSettings = lazy(() => import("../components/tabs/developer"));
const ProtonSettings = lazy(() => import("../components/tabs/proton"));

enum Tabs {
	general = 0,
	download = 1,
	plugins = 2,
	accounts = 3,
	miscellaneous = 4,
	developer = 5,
	proton = 6,
}

interface Tab {
	icon: ReactElement;
	titleKey: string;
	index: Tabs;
	component: ComponentType;
}

export const useSettingsTabs = () => {
	const [currentTab, setCurrentTab] = useState<Tabs>(0);

	const {
		data: isProtonSupported,
		isLoading: isProtonSupportedLoading,
		isError: isProtonSupportedError,
	} = trpc.proton.isProtonSupported.useQuery();

	const baseTabs: Array<Tab> = [
		{
			icon: <Cog />,
			titleKey: "General",
			index: 0,
			component: GeneralSettings,
		},
		{
			icon: <FileCog2 />,
			titleKey: "Download",
			index: 1,
			component: DownloadSettings,
		},
		{
			icon: <UserCog />,
			titleKey: "Accounts",
			index: 2,
			component: AccountSettings,
		},
		{
			icon: <Blocks />,
			titleKey: "Plugins",
			index: 3,
			component: PluginSettings,
		},
		{
			icon: <Code2 />,
			titleKey: "Developer",
			index: 4,
			component: DeveloperSettings,
		},
		{
			icon: <Settings2 />,
			titleKey: "Miscellaneous",
			index: 5,
			component: MiscellaneousSettings,
		},
	];

	// Only include Proton tab if it's supported and not loading/errored
	const tabs: Array<Tab> =
		isProtonSupported && !isProtonSupportedLoading && !isProtonSupportedError
			? [
					...baseTabs,
					{
						icon: <Layers />,
						titleKey: "Proton",
						index: 6,
						component: ProtonSettings,
					},
				]
			: baseTabs;
	const ActiveComponent = tabs.find(
		(tab) => tab.index === currentTab,
	)?.component;

	return { tabs, currentTab, setCurrentTab, ActiveComponent };
};
