import { useSettings } from "@/features/settings/hooks/useSettings";
// import { useSettings } from "@/hooks";
import { cn, shouldHideTitleBar } from "@/lib";
import NavBarBottom from "./containers/bottom";
import { NavBarMiddle } from "./containers/middle";
import NavBarTop from "./containers/top";

const NavBar = () => {
	const { settings } = useSettings();

	const titleBarStyle = settings?.titleBarStyle;

	return (
		<aside
			className={cn(
				"fixed inset-y-0 left-0 z-10 flex w-16 flex-col bg-background",
				{
					"top-8": !shouldHideTitleBar(titleBarStyle),
				},
			)}
		>
			<nav className="flex h-full flex-col items-center gap-2 px-2 py-4">
				<NavBarTop />
				<div className="flex h-full w-full flex-1 flex-col gap-3 border-t border-b p-1 py-4">
					<NavBarMiddle />
				</div>
				<NavBarBottom />
			</nav>
		</aside>
	);
};

export default NavBar;
