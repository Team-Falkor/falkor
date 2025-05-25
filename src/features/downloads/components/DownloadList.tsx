import { useEffect } from "react";
import { DownloadStatus, type RouterOutputs } from "@/@types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { CachingDownloadItem } from "./CachingDownloadItem";
import { DownloadItem } from "./DownloadItem";

export function DownloadList() {
	const { data: downloads } = trpc.downloads.getAll.useQuery(undefined, {
		refetchInterval: 2500, // 2.5 seconds
		// refetchIntervalInBackground: false,
		staleTime: 2500,
		// refetchOnWindowFocus: true,
		// refetchOnMount: true,
	});
	const { data: cachingItems } = trpc.downloads.getCachingItems.useQuery(
		undefined,
		{
			refetchInterval: 60_000, // 1 minute
			// refetchIntervalInBackground: false,
			// staleTime: 2500,
			// refetchOnWindowFocus: true,
			// refetchOnMount: true,
		},
	);

	useEffect(() => {
		console.log("cachingItems", cachingItems);
	}, [cachingItems]);

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

	const renderTab = (
		downloads: RouterOutputs["downloads"]["getAll"] = [],
		caching: RouterOutputs["downloads"]["getCachingItems"] = [],
	) => {
		if (downloads.length === 0 && caching.length === 0) {
			return renderEmptyTag("Nothing here yet. Start downloading something!");
		}

		// Merge and tag items
		const allDownloads = [
			...downloads.map((item) => ({
				...item,
				typeOf: "download" as const,
			})),
			...caching.map((item) => ({
				...item,
				typeOf: "caching" as const,
			})),
		];

		return (
			<div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2 xl:grid-cols-3">
				{allDownloads.map((item) =>
					item.typeOf === "download" ? (
						<DownloadItem key={`download-${item.id}`} {...item} />
					) : (
						<CachingDownloadItem key={`caching-${item.id}`} {...item} />
					),
				)}
			</div>
		);
	};

	return (
		<Tabs defaultValue="all" className="w-full">
			<TabsList className="mb-4 grid h-auto w-full grid-cols-2 sm:grid-cols-5">
				<TabsTrigger value="all">
					All {[...all, ...(cachingItems ?? [])]?.length ?? 0}
				</TabsTrigger>
				<TabsTrigger value="active">Active {active?.length ?? 0}</TabsTrigger>
				<TabsTrigger value="queued">Queued {queued?.length ?? 0}</TabsTrigger>
				<TabsTrigger value="completed">
					Completed {completed?.length ?? 0}
				</TabsTrigger>
				<TabsTrigger value="failed">Failed {failed?.length ?? 0}</TabsTrigger>
			</TabsList>
			<TabsContent value="all">{renderTab(all, cachingItems)}</TabsContent>
			<TabsContent value="active">{renderTab(active)}</TabsContent>
			<TabsContent value="queued">{renderTab(queued)}</TabsContent>
			<TabsContent value="completed">{renderTab(completed)}</TabsContent>
			<TabsContent value="failed">{renderTab(failed)}</TabsContent>
		</Tabs>
	);
}
