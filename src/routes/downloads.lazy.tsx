import { createLazyFileRoute } from "@tanstack/react-router";
import { DownloadList } from "@/features/downloads/components/DownloadList";

export const Route = createLazyFileRoute("/downloads")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="mx-auto w-full px-4 py-6 sm:px-6 lg:px-8">
			<div className="mb-6 flex flex-wrap items-center justify-between gap-4">
				<h1 className="font-bold text-2xl sm:text-3xl">Downloads</h1>
			</div>
			<DownloadList />
		</div>
	);
}
