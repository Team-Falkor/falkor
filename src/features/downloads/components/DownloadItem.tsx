import {
	ArrowDownToLine,
	ClockIcon,
	PauseIcon,
	PlayIcon,
	TrashIcon,
	XIcon,
} from "lucide-react";
import type { RouterOutputs } from "@/@types";
import { DownloadStatus } from "@/@types/download/queue";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { formatBytes, formatTimeRemaining } from "@/lib/utils";

export function DownloadItem(
	initalData: RouterOutputs["downloads"]["getAll"][number],
) {
	const utils = trpc.useUtils();
	const pauseMutation = trpc.downloads.pause.useMutation({
		onSuccess: async () => await utils.downloads.invalidate(),
	});
	const resumeMutation = trpc.downloads.resume.useMutation({
		onSuccess: async () => await utils.downloads.invalidate(),
	});
	const cancelMutation = trpc.downloads.cancel.useMutation({
		onSuccess: async () => await utils.downloads.invalidate(),
	});
	const removeMutation = trpc.downloads.remove.useMutation({
		onSuccess: async () => await utils.downloads.invalidate(),
	});

	const handlePause = () =>
		pauseMutation.mutate(
			{ id: initalData.id },
			{
				onSuccess: async () => await utils.downloads.invalidate(),
			},
		);
	const handleResume = () =>
		resumeMutation.mutate(
			{ id: initalData.id },
			{
				onSuccess: async () => await utils.downloads.invalidate(),
			},
		);
	const handleCancel = () =>
		cancelMutation.mutate(
			{ id: initalData.id },
			{
				onSuccess: async () => await utils.downloads.invalidate(),
			},
		);
	const handleRemove = () =>
		removeMutation.mutate(
			{ id: initalData.id },
			{
				onSuccess: async () => await utils.downloads.invalidate(),
			},
		);

	const { data: liveData } = trpc.downloads.getById.useQuery(
		{ id: initalData.id },
		{
			refetchInterval: 1000,
		},
	);

	const download = liveData ?? initalData;
	const status = download.status;

	const isActive = status === DownloadStatus.DOWNLOADING;
	const isPaused = status === DownloadStatus.PAUSED;
	const isCompleted = status === DownloadStatus.COMPLETED;
	const isFailed = status === DownloadStatus.FAILED;
	const isCancelled = status === DownloadStatus.CANCELLED;

	return (
		<Card key={download.id}>
			<CardHeader className="pb-2">
				<div className="flex flex-wrap items-start justify-between gap-2">
					<CardTitle className="mr-2 break-words text-lg">
						{decodeURIComponent(download?.name ?? "Untitled Download")}
					</CardTitle>

					<div className="flex flex-shrink-0 space-x-1">
						{isActive && (
							<Button
								variant="ghost"
								size="icon"
								onClick={() => handlePause()}
								aria-label="Pause download"
							>
								<PauseIcon />
							</Button>
						)}

						{isPaused && (
							<Button
								variant="ghost"
								size="icon"
								onClick={() => handleResume()}
								aria-label="Resume download"
							>
								<PlayIcon />
							</Button>
						)}

						{(isActive ||
							isPaused ||
							download.status === DownloadStatus.QUEUED) && (
							<Button
								variant="ghost"
								size="icon"
								onClick={() => handleCancel()}
								aria-label="Cancel download"
							>
								<XIcon />
							</Button>
						)}

						{(isCompleted || isFailed || isCancelled) && (
							<Button
								variant="ghost"
								size="icon"
								onClick={() => handleRemove()}
								aria-label="Remove download from list"
								className="text-destructive hover:text-destructive"
							>
								<TrashIcon />
							</Button>
						)}
					</div>
				</div>
				<CardDescription>
					{download.type === "http"
						? "HTTP"
						: download.type?.toUpperCase() || "Download"}{" "}
					• {formatBytes(download.size || 0)}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					{!isCompleted && !isFailed && !isCancelled && (
						<Progress value={download.progress ?? 0} className="h-2" />
					)}

					{isFailed && (
						<p className="text-red-600 text-sm">
							Failed: {download.error || "Unknown error"}
						</p>
					)}

					{isCancelled && (
						<p className="text-muted-foreground text-sm">Cancelled</p>
					)}

					{(isActive ||
						isPaused ||
						download.status === DownloadStatus.QUEUED) && (
						<div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-muted-foreground text-xs">
							<div className="flex items-center gap-1">
								{isActive && (
									<>
										<ArrowDownToLine className="h-3 w-3 text-blue-500" />
										<span>{formatBytes(download.speed || 0)}/s</span>
									</>
								)}
								{isPaused && (
									<span className="font-medium text-yellow-600">Paused</span>
								)}
								{download.status === DownloadStatus.QUEUED && (
									<span className="font-medium">Queued</span>
								)}
							</div>
							<div className="flex items-center gap-1">
								{isActive &&
									download.timeRemaining != null &&
									download.timeRemaining > 0 && (
										<>
											<ClockIcon className="h-3 w-3" />
											<span>{formatTimeRemaining(download.timeRemaining)}</span>
										</>
									)}
							</div>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
