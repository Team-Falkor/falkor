import { createRootRoute, Outlet } from "@tanstack/react-router";
import TitleBar from "@/components/title-bar";
import { TooltipProvider } from "@/components/ui/tooltip";
import NavBar from "@/features/navigation/components/navbar";
import { useSettings } from "@/features/settings/hooks/useSettings";
import Updater from "@/features/updater/components/updater";
import { cn, shouldHideTitleBar } from "@/lib";

export const Route = createRootRoute({
	component: Root,
});

function Root() {
	const { settings } = useSettings();
	// useAppStartup();

	const titleBarStyle = settings?.titleBarStyle;

	return (
		<TooltipProvider>
			<div className={cn("flex min-h-screen flex-col overflow-hidden")}>
				<TitleBar />

				{/* Wrapper for Updater and main content */}
				<Updater />
				<div
					className={cn("relative flex min-h-screen w-full bg-muted/40", {
						"pt-8": !shouldHideTitleBar(titleBarStyle),
					})}
				>
					{/* Sidebar navigation */}
					<NavBar />

					{/* Main content area */}
					<div className="flex h-full w-full grow flex-col overflow-y-auto sm:pl-16">
						<Outlet />
					</div>
				</div>
			</div>
		</TooltipProvider>
	);
}
