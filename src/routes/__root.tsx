import TitleBar from "@/components/titleBar";
import { TooltipProvider } from "@/components/ui/tooltip";
import NavBar from "@/features/navigation/components/navbar";
import Updater from "@/features/updater/components/updater";
import { useAppStartup, useSettings } from "@/hooks";
import { cn, shouldHideTitleBar } from "@/lib";
import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: Root,
});

function Root() {
  const { settings } = useSettings();
  useAppStartup();

  const titleBarStyle = settings?.titleBarStyle;

  return (
    <TooltipProvider>
      <div className={cn("flex flex-col min-h-screen overflow-hidden")}>
        {/* TitleBar positioned at the top */}
        <TitleBar />

        {/* Wrapper for Updater and main content */}
        <Updater />
        <div
          className={cn("relative flex w-full min-h-screen bg-muted/40", {
            "pt-8": !shouldHideTitleBar(titleBarStyle),
          })}
        >
          {/* Sidebar navigation */}
          <NavBar />

          {/* Main content area */}
          <div className="flex flex-col grow w-full h-full overflow-y-auto sm:pl-16">
            <Outlet />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
