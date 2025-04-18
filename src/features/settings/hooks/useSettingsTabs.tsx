import { Blocks, Code2, Cog, FileCog2, Settings2, UserCog } from "lucide-react";
import { ComponentType, lazy, ReactElement, useState } from "react";

const GeneralSettings = lazy(() => import("../components/tabs/general"));
const DownloadSettings = lazy(() => import("../components/tabs/download"));
const PluginSettings = lazy(() => import("../components/tabs/plugins"));
const AccountSettings = lazy(() => import("../components/tabs/accounts"));
const MiscellaneousSettings = lazy(
  () => import("../components/tabs/miscellaneous")
);
const DeveloperSettings = lazy(() => import("../components/tabs/developer"));

enum Tabs {
  general = 0,
  download = 1,
  plugins = 2,
  accounts = 3,
  miscellaneous = 4,
  developer = 5,
}

interface Tab {
  icon: ReactElement;
  titleKey: string;
  index: Tabs;
  component: ComponentType;
}

export const useSettingsTabs = () => {
  const [currentTab, setCurrentTab] = useState<Tabs>(0);

  const tabs: Array<Tab> = [
    {
      icon: <Cog />,
      titleKey: "general",
      index: 0,
      component: GeneralSettings,
    },
    {
      icon: <FileCog2 />,
      titleKey: "download",
      index: 1,
      component: DownloadSettings,
    },
    {
      icon: <UserCog />,
      titleKey: "accounts",
      index: 2,
      component: AccountSettings,
    },
    {
      icon: <Blocks />,
      titleKey: "plugins",
      index: 3,
      component: PluginSettings,
    },
    {
      icon: <Code2 />,
      titleKey: "developer",
      index: 4,
      component: DeveloperSettings,
    },
    {
      icon: <Settings2 />,
      titleKey: "miscellaneous",
      index: 5,
      component: MiscellaneousSettings,
    },
  ];
  const ActiveComponent = tabs.find(
    (tab) => tab.index === currentTab
  )?.component;

  return { tabs, currentTab, setCurrentTab, ActiveComponent };
};
