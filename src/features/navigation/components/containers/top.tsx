import logo from "@resources/icon.png";
import { Link } from "@tanstack/react-router";
import { CalendarDays, HomeIcon, LibraryIcon } from "lucide-react";
import { useState } from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import Search from "@/features/search/components/search";

import { useLanguageContext } from "@/i18n/I18N";
import NavItem from "../item";

const NavBarTop = () => {
	const [open, setOpen] = useState(false);

	const { t } = useLanguageContext();
	return (
		<>
			<div className="pt-2 pb-2">
				<Tooltip>
					<TooltipTrigger asChild>
						<Link aria-label="Home" className="group" to="/">
							<img
								src={logo}
								alt="logo"
								className="size-11 object-contain transition-all group-hover:opacity-80"
							/>
						</Link>
					</TooltipTrigger>
					<TooltipContent side="right">{t("logo_hover")}</TooltipContent>
				</Tooltip>
			</div>

			<div className="grid gap-2 pb-4">
				<Search />

				<NavItem href="/" title={t("home")} icon={<HomeIcon />} />

				<NavItem
					href="/calendar"
					title={t("calendar")}
					icon={<CalendarDays />}
				/>

				<NavItem href="/library" title={t("my_games")} icon={<LibraryIcon />} />
			</div>
		</>
	);
};

export default NavBarTop;
