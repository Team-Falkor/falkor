import { DownloadStatus } from "@/@types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { DownloadItem } from "./DownloadItem";

export function DownloadList() {
	const { data: downloads } = trpc.downloads.getAll.useQuery(undefined, {
		refetchInterval: 2500, // 2.5 seconds
		refetchIntervalInBackground: false,
		staleTime: 2500,
		refetchOnWindowFocus: true,
		refetchOnMount: true,
	});

	// Set all to its own const for contanuity
	const all = downloads ?? [];

	// Filter downloads by status
	const active = all.filter(
		(item) => item.status === DownloadStatus.DOWNLOADING,
	);
	const queued = all.filter((item) => item.status === DownloadStatus.QUEUED);
	const completed = all.filter(
		(item) => item.status === DownloadStatus.COMPLETED,
	);
	const failed = all.filter((item) => item.status === DownloadStatus.FAILED);

	const renderEmptyTag = (text: string) => {
		return (
			<p className="w-full py-12 text-left text-muted-foreground">{text}</p>
		);
	};

	const renderTab = (downloads: typeof all) => {
		if (!downloads?.length) {
			return renderEmptyTag("Nothing here yet. Start downloading something!");
		}

		return (
			<div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2 xl:grid-cols-3">
				{downloads.map((download) => (
					<DownloadItem key={download.id} {...download} />
				))}
			</div>
		);
	};

	return (
		<Tabs defaultValue="all" className="w-full">
			<TabsList className="mb-4 grid h-auto w-full grid-cols-2 sm:grid-cols-5">
				<TabsTrigger value="all">All {all?.length ?? 0}</TabsTrigger>
				<TabsTrigger value="active">Active {active?.length ?? 0}</TabsTrigger>
				<TabsTrigger value="queued">Queued {queued?.length ?? 0}</TabsTrigger>
				<TabsTrigger value="completed">
					Completed {completed?.length ?? 0}
				</TabsTrigger>
				<TabsTrigger value="failed">Failed {failed?.length ?? 0}</TabsTrigger>
			</TabsList>
			<TabsContent value="all">{renderTab(all)}</TabsContent>
			<TabsContent value="active">{renderTab(active)}</TabsContent>
			<TabsContent value="queued">{renderTab(queued)}</TabsContent>
			<TabsContent value="completed">{renderTab(completed)}</TabsContent>
			<TabsContent value="failed">{renderTab(failed)}</TabsContent>
		</Tabs>
	);
}
