import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { DownloadItem } from "./DownloadItem";

export function DownloadList() {
	const { data: downloads } = trpc.downloads.getAll.useQuery();

	if (!downloads?.length) {
		return (
			<div className="flex h-[50vh] items-center justify-center">
				<p className="text-muted-foreground">No downloads</p>
			</div>
		);
	}

	return (
		<ScrollArea className="h-[calc(100vh-6rem)] pr-4">
			<div className="space-y-4">
				{downloads.map((download) => (
					<DownloadItem
						key={download.id}
						id={download.id}
						name={download.name}
						progress={download.progress}
						status={download.status}
						speed={download.speed}
						size={download.size}
						timeRemaining={download.timeRemaining}
					/>
				))}
			</div>
		</ScrollArea>
	);
}
