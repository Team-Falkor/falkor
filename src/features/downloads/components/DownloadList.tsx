import { DownloadStatus } from "@/@types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { DownloadItem } from "./DownloadItem";

export function DownloadList() {
	const { data: downloads } = trpc.downloads.getAll.useQuery();

	// if (!downloads?.length) {
	// 	return (
	// 		<div className="flex h-[50vh] items-center justify-center">
	// 			<p className="text-muted-foreground">No downloads</p>
	// 		</div>
	// 	);
	// }

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

	const renderTab = (downloads: typeof all) => {
		if (!downloads?.length) {
			return (
				<div className="flex h-[50vh] items-center justify-center">
					<p className="text-muted-foreground">No downloads</p>
				</div>
			);
		}

		return downloads.map((download) => (
			<DownloadItem key={download.id} {...download} />
		));
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
			<TabsContent
				value="all"
				className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2 xl:grid-cols-3"
			>
				{renderTab(all)}
			</TabsContent>
			<TabsContent
				value="active"
				className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2 xl:grid-cols-3"
			>
				{renderTab(active)}
			</TabsContent>
			<TabsContent
				value="queued"
				className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2 xl:grid-cols-3"
			>
				{renderTab(queued)}
			</TabsContent>
			<TabsContent
				value="completed"
				className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2 xl:grid-cols-3"
			>
				{renderTab(completed)}
			</TabsContent>
			<TabsContent
				value="failed"
				className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2 xl:grid-cols-3"
			>
				{renderTab(failed)}
			</TabsContent>
		</Tabs>
	);
}
