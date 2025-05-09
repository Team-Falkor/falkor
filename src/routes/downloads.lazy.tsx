import { createLazyFileRoute } from "@tanstack/react-router";
import { DownloadList } from "@/features/downloads/components/DownloadList";

export const Route = createLazyFileRoute("/downloads")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="container space-y-6 py-6">
			<h1 className="font-bold text-3xl">Downloads</h1>
			<DownloadList />
		</div>
	);
}
