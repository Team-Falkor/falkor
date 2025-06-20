import logo from "@resources/icon.png";
import { Link } from "@tanstack/react-router";
import { CalendarDays, HomeIcon, LibraryIcon, User2Icon } from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import SearchCommand from "@/features/search/components/SearchCommand";
import { useLanguageContext } from "@/i18n/I18N";
import NavItem from "../item";

const NavBarTop = () => {
	// const [open, setOpen] = useState(false);

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
								className="size-11 object-contain transition-all group-focus-states:opacity-80"
							/>
						</Link>
					</TooltipTrigger>
					<TooltipContent side="right">{t("logo_hover")}</TooltipContent>
				</Tooltip>
			</div>

			<div className="grid gap-2 pb-4">
				<SearchCommand />

				<NavItem href="/" title={t("home")} icon={<HomeIcon />} />

				<NavItem href="/profile" title={t("profile")} icon={<User2Icon />} />

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
