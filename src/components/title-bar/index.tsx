import { useSettings } from "@/features/settings/hooks/useSettings";
import { useLanguageContext } from "@/i18n/I18N";
import { H4 } from "../ui/typography";
import TitleBarIcons from "./icons";
import TitleBarTrafficLights from "./traffic-lights";

const TitleBar = () => {
	const { t } = useLanguageContext();
	const { settings } = useSettings();

	const titleBarStyle = settings?.titleBarStyle;

	if (titleBarStyle === "none") return null;
	if (titleBarStyle === "native") return null;

	return (
		<div className="pointer-events-auto fixed top-0 z-999999 flex h-8 w-full items-center border-muted border-b bg-background shadow-md">
			<div className="flex w-full flex-row items-center justify-between">
				{/* Title */}
				<div id="titlebar" className="flex h-full flex-1 items-center pl-3">
					<H4>{t("falkor")}</H4>
				</div>
				<div className="flex gap-1 pr-3">
					{titleBarStyle === "icons" ? (
						<TitleBarIcons />
					) : (
						<TitleBarTrafficLights />
					)}
				</div>
			</div>
		</div>
	);
};

export default TitleBar;
