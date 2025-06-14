import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import type { ToastNotification } from "@/@types";
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

	useEffect(() => {
		// Handler for toast events
		function handleToastEvent(
			_event: unknown,
			{ message, type, description }: ToastNotification,
		) {
			switch (type) {
				case "success":
					toast.success(message, { description });
					break;
				case "error":
					toast.error(message, { description });
					break;
				case "warning":
					toast.warning(message, { description });
					break;
				case "info":
					toast.info(message, { description });
					break;
				default:
					toast(message, { description });
					break;
			}
		}

		// Listen for the toast event from Electron
		window.ipcRenderer.on("toast:show", handleToastEvent);

		// Cleanup on unmount
		return () => {
			window.ipcRenderer.removeListener("toast:show", handleToastEvent);
		};
	}, []);

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
