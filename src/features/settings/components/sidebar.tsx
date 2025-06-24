import { DownloadCloud } from "lucide-react";
import type { ReactElement } from "react";
import { FaDiscord, FaGithub } from "react-icons/fa6";
import { SiKofi } from "react-icons/si";
import type { LinkItemType } from "@/@types";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { H3, H4, TypographyMuted } from "@/components/ui/typography";
import { useUpdater } from "@/hooks";
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
	const { status, downloadUpdate, installUpdate } = useUpdater();
	const { t } = useLanguageContext();
	const { data: settings } = trpc.settings.read.useQuery();
	const { data, isPending, isError } = trpc.app.appInfo.useQuery();

	const isUpdateAvailable = status === "UPDATE_AVAILABLE";
	const isUpdateDownloaded = status === "DOWNLOADED";
	const showUpdateButton = isUpdateAvailable || isUpdateDownloaded;

	const handleUpdateClick = () => {
		if (isUpdateAvailable) {
			downloadUpdate();
		} else if (isUpdateDownloaded) {
			installUpdate();
		}
	};

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
			<nav className="flex-1">{settingsTabs}</nav>
			<div className="mt-auto flex flex-col gap-4 p-4">
				{!isPending && !isError && (
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-3">
							<H4>{t("falkor")}</H4>
							{showUpdateButton && (
								<TooltipProvider delayDuration={100}>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												onClick={handleUpdateClick}
												className="size-7 animate-pulse text-primary hover:bg-primary/10"
											>
												<DownloadCloud className="size-5" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											<p>
												{isUpdateDownloaded
													? t("restart_to_install")
													: t("update_available")}
											</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							)}
						</div>
						<TypographyMuted>
							{t("version")}: {data?.appVersion}
						</TypographyMuted>
					</div>
				)}
				<div className="flex shrink-0 grow-0 justify-between">
					<SettingsLinkGroup links={LINKS} />
					<SettingsLinkGroup links={LINKS_RIGHT} />
				</div>
			</div>
		</div>
	);
};

export default SettingsSidebar;
