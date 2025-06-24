import { useMatches, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const generateRandomIgdbId = () => {
	return Math.floor(Math.random() * (100000 - 1000 + 1)) + 1000;
};

const GenericDevTools = () => {
	const router = useRouter();
	const matches = useMatches();
	const [open, setOpen] = useState(false);

	const navigableRoutes = router.flatRoutes
		.filter((route) => {
			const isInternalOrLayout =
				!route.to || route.id.startsWith("/__") || route.id.includes("/_");
			return !isInternalOrLayout;
		})
		.map((route) => {
			let displayName = route.path || route.id;
			let targetTo = route.to;

			if (route.to === "/") {
				displayName = "Home";
			} else {
				displayName = displayName
					.replace(/^\//, "")
					.replace(/\//g, " / ")
					.replace(/\$/g, ":");

				if (route.id === "/info/$id") {
					targetTo = `/info/${generateRandomIgdbId()}`;
				}
			}

			return {
				id: route.id,
				to: targetTo,
				displayName: displayName,
			};
		})
		.sort((a, b) => a.displayName.localeCompare(b.displayName));

	const currentRoutePath = matches[matches.length - 1]?.pathname || "/";
	const currentRouteDisplayName =
		navigableRoutes.find((r) => r.to === currentRoutePath)?.displayName ||
		"Current Page";

	const handleNavigate = (path: string) => {
		router.navigate({ to: path });
		setOpen(false);
	};

	return (
		<div className="flex min-w-56 flex-col gap-2 p-4">
			<h3 className="text-center font-bold">Generic Dev Tools</h3>

			<DropdownMenu open={open} onOpenChange={setOpen}>
				<DropdownMenuTrigger asChild>
					<Button
						size="sm"
						variant="outline"
						disabled={navigableRoutes.length === 0}
					>
						Go to: {currentRouteDisplayName}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					className="z-[10000] max-h-64 overflow-y-auto"
					side="top"
					align="start"
					sideOffset={8}
				>
					{navigableRoutes.length > 0 ? (
						navigableRoutes.map((route) => (
							<DropdownMenuItem
								key={route.id}
								onSelect={() => handleNavigate(route.to)}
								className="cursor-pointer"
								data-current={
									currentRoutePath === route.to ? "true" : undefined
								}
							>
								{route.displayName}
							</DropdownMenuItem>
						))
					) : (
						<DropdownMenuItem disabled>
							No navigable pages found.
						</DropdownMenuItem>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};

export default GenericDevTools;
