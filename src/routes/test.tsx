import { createFileRoute } from "@tanstack/react-router";
import { GameLocatorDialog } from "@/features/game-locator/components/dialog";

export const Route = createFileRoute("/test")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div>
			<GameLocatorDialog />
		</div>
	);
}
