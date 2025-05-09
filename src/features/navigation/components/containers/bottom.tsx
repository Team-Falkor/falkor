import { DownloadIcon, Settings2 } from "lucide-react";
import { useLanguageContext } from "@/i18n/I18N";
import NavItem from "../item";

const NavBarBottom = () => {
	const { t } = useLanguageContext();

	return (
		<div className="grid gap-3.5">
			<NavItem
				href="/downloads"
				title={t("sections.downloads")}
				icon={<DownloadIcon />}
			/>
			<NavItem
				href="/settings"
				title={t("sections.settings")}
				icon={<Settings2 />}
			/>
		</div>
	);
};

export default NavBarBottom;
