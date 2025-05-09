import type { ReactElement } from "react";
import { FaDiscord, FaGithub } from "react-icons/fa6";
import { SiKofi } from "react-icons/si";
import type { LinkItemType } from "@/@types";
// import { useUpdater } from "@/hooks/useUpdater";
import { H3 } from "@/components/ui/typography";
import { useLanguageContext } from "@/i18n/I18N";
import { cn, shouldHideTitleBar, trpc } from "@/lib";
import SettingsLinkGroup from "./linkGroup";

const LINKS: Array<LinkItemType> = [
	{
		icon: <FaDiscord />,
		title: "join_the_discord",
		url: "https://falkor.moe/discord",
	},
	{
		icon: <FaGithub />,
		title: "star_us_on_github",
		url: "https://github.com/team-falkor/app",
	},
];

const LINKS_RIGHT: Array<LinkItemType> = [
	{
		icon: <SiKofi />,
		title: "support_me_on_kofi",
		url: "https://ko-fi.com/prostarz",
	},
];

const SettingsSidebar = ({
	settingsTabs,
}: {
	settingsTabs: ReactElement[];
}) => {
	// const { updateAvailable, installUpdate } = useUpdater(false);
	const { t } = useLanguageContext();
	const { data: settings } = trpc.settings.read.useQuery();

	// const { data, isPending, isError } = useQuery({
	//   queryKey: ["app", "info"],

	//   queryFn: async () => {
	//     const response = await invoke<AppInfo>("generic:get-app-info");
	//     return response;
	//   },
	// });

	return (
		<div
			className={cn(
				"fixed inset-y-0 top-0 flex h-[calc(100vh-2rem)] w-full flex-col bg-background md:w-80",
				{
					"top-8": !shouldHideTitleBar(settings?.titleBarStyle),
				},
			)}
		>
			<div className="p-4">
				<H3>{t("sections.settings")}</H3>
			</div>
			<nav className="flex-1 space-y-1 ">{settingsTabs}</nav>
			<div className="mt-auto flex flex-col gap-2 p-1 px-4">
				{/* {!isPending && !isError && (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-3">
              <P className="font-bold capitalize">{t("falkor")}</P>
              {updateAvailable && (
                <Button
                  variant={"ghost"}
                  size={"icon"}
                  onClick={installUpdate}
                  className="size-7"
                >
                  <DownloadCloud className="size-5" />
                </Button>
              )}
            </div>
            <TypographyMuted>
              {t("version")}: {data?.app_version}
            </TypographyMuted>
          </div>
        )} */}
				<div className="flex shrink-0 grow-0 justify-between">
					<SettingsLinkGroup links={LINKS} />
					<SettingsLinkGroup links={LINKS_RIGHT} />
				</div>
			</div>
		</div>
	);
};

export default SettingsSidebar;
