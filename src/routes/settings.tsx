import Spinner from "@/components/spinner";
import { useLanguageContext } from "@/contexts/I18N";
import SettingsSidebar from "@/features/settings/components/sidebar";
import SettingTab from "@/features/settings/components/tab";
import { useSettingsTabs } from "@/features/settings/hooks/useSettingsTabs";
import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { Suspense, useEffect, useMemo } from "react";
import { z } from "zod";

const searchParamsSchema = z.object({
  tab: z.string().optional(),
});

export const Route = createFileRoute("/settings")({
  component: RouteComponent,
  validateSearch: zodValidator(searchParamsSchema),
});

function RouteComponent() {
  const searchParams = Route.useSearch();
  const { t } = useLanguageContext();
  const { tabs, currentTab, setCurrentTab, ActiveComponent } =
    useSettingsTabs();

  useEffect(() => {
    if (!searchParams.tab) return;

    // find the tab with the matching title
    const tab = tabs.find((tab) => tab.titleKey === searchParams.tab);
    if (!tab) {
      setCurrentTab(0);
      return;
    }

    setCurrentTab(tab.index);
  }, [searchParams.tab, tabs, setCurrentTab]);

  const settingsTabs = useMemo(
    () =>
      tabs.map(({ icon, titleKey, index }) => (
        <SettingTab
          key={index}
          icon={icon}
          title={t(titleKey)}
          isActive={currentTab === index}
          onClick={() => setCurrentTab(index)}
        />
      )),
    [tabs, t, currentTab, setCurrentTab]
  );

  return (
    <div className="relative flex w-full min-h-full">
      <SettingsSidebar settingsTabs={settingsTabs} />

      <div className="flex flex-col grow w-full h-full overflow-y-auto md:pl-80">
        <Suspense
          fallback={
            <div className="flex items-center justify-center size-full">
              <Spinner size={23} />
            </div>
          }
        >
          {ActiveComponent && <ActiveComponent />}
        </Suspense>
      </div>
    </div>
  );
}
