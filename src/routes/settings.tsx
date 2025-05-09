import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { Suspense, useEffect } from "react";
import { z } from "zod";
import Spinner from "@/components/spinner";
import SettingsSidebar from "@/features/settings/components/sidebar";
import SettingTab from "@/features/settings/components/tab";
import { useSettingsTabs } from "@/features/settings/hooks/useSettingsTabs";
import { useLanguageContext } from "@/i18n/I18N";

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

	const settingsTabs = tabs.map(({ icon, titleKey, index }) => (
		<SettingTab
			key={index}
			icon={icon}
			title={t(titleKey)}
			isActive={currentTab === index}
			onClick={() => setCurrentTab(index)}
		/>
	));

	return (
		<div className="relative flex min-h-full w-full">
			<SettingsSidebar settingsTabs={settingsTabs} />

			<div className="flex h-full w-full grow flex-col overflow-y-auto md:pl-80">
				<Suspense
					fallback={
						<div className="flex size-full items-center justify-center">
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
