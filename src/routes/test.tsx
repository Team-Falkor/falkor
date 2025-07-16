import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/test")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button>scan folder for games</Button>
			</DialogTrigger>
		</Dialog>
	);
}
