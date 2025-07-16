import {
	ArrowDownToLine,
	ArrowUpFromLine,
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
import { useDownloadActions } from "@/hooks";
import { formatBytes, formatTimeRemaining } from "@/lib/utils";

type Item = RouterOutputs["downloads"]["getAll"][number];

interface DownloadItemData extends Item {
	typeOf: "download";
}

export function DownloadItem(data: DownloadItemData) {
	const {
		pauseDownload,
		isPausingDownload,
		resumeDownload,
		isResumingDownload,
		cancelDownload,
		isCancellingDownload,
		removeDownload,
		isRemovingDownload,
	} = useDownloadActions();

	const handlePause = () => {
		if (isPausingDownload) return;
		pauseDownload({ id: data.id });
	};

	const handleResume = () => {
		if (isResumingDownload) return;
		resumeDownload({ id: data.id });
	};

	const handleCancel = () => {
		if (isCancellingDownload) return;
		cancelDownload({ id: data.id });
	};

	const handleRemove = () => {
		if (isRemovingDownload) return;
		removeDownload({ id: data.id });
	};

	const download = data;
	const status = download.status;

	console.log({ download });

	const isActive = status === DownloadStatus.DOWNLOADING;
	const isPaused = status === DownloadStatus.PAUSED;
	const isCompleted = status === DownloadStatus.COMPLETED;
	const isFailed = status === DownloadStatus.FAILED;
	const isCancelled = status === DownloadStatus.CANCELLED;
	const isSeeding = status === DownloadStatus.SEEDING;
	const isNone = status === DownloadStatus.NONE;
	const isRemoved = status === DownloadStatus.REMOVED;

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
								onClick={handlePause}
								aria-label="Pause download"
								disabled={isPausingDownload}
								className={isPausingDownload ? "opacity-50" : ""}
							>
								<PauseIcon />
							</Button>
						)}

						{isPaused && (
							<Button
								variant="ghost"
								size="icon"
								onClick={handleResume}
								aria-label="Resume download"
								disabled={isResumingDownload}
								className={isResumingDownload ? "opacity-50" : ""}
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
								onClick={handleCancel}
								aria-label="Cancel download"
								disabled={isCancellingDownload}
								className={isCancellingDownload ? "opacity-50" : ""}
							>
								<XIcon />
							</Button>
						)}

						{(isCompleted ||
							isFailed ||
							isCancelled ||
							isSeeding ||
							isNone ||
							isRemoved) && (
							<Button
								variant="ghost"
								size="icon"
								onClick={handleRemove}
								aria-label="Remove download from list"
								className="text-destructive focus-states:text-destructive"
								disabled={isRemovingDownload}
							>
								<TrashIcon />
							</Button>
						)}
					</div>
				</div>
				<CardDescription>
					{[DownloadStatus.UNZIPPING, DownloadStatus.UNRARRING].includes(
						download.status,
					)
						? "Un-Archiving"
						: download.type === "http"
							? "HTTP"
							: (download.type?.toUpperCase() ?? "Download")}{" "}
					• {formatBytes(download.size || 0)}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					{!isCompleted &&
						!isFailed &&
						!isCancelled &&
						!isSeeding &&
						!isNone &&
						!isRemoved && (
							<Progress value={download.progress ?? 0} className="h-2" />
						)}

					{isFailed && (
						<div className="space-y-2">
							<p className="text-red-600 text-sm">
								Failed: {download.error || "Unknown error"}
							</p>
							<Button
								variant="outline"
								size="sm"
								onClick={handleResume}
								disabled={isResumingDownload}
								className={isResumingDownload ? "opacity-50" : ""}
							>
								<PlayIcon className="mr-1 h-3 w-3" />
								Retry
							</Button>
						</div>
					)}

					{isCancelled && (
						<p className="text-muted-foreground text-sm">Cancelled</p>
					)}

					{isSeeding && (
						<div className="space-y-1">
							<div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-muted-foreground text-xs">
								<div className="flex items-center gap-1">
									<ArrowDownToLine className="h-3 w-3 text-green-500" />
									<span>Seeding</span>
									{download?.uploadSpeed && download.uploadSpeed > 0 && (
										<span className="ml-1">
											{formatBytes(download.uploadSpeed)}/s
										</span>
									)}
								</div>
								{download?.peers && download.peers > 0 && (
									<div className="flex items-center gap-1">
										<span>{download.peers} peers</span>
									</div>
								)}
							</div>
							{download?.uploaded && download.uploaded > 0 && (
								<div className="flex items-center gap-1 text-muted-foreground text-xs">
									<ArrowUpFromLine className="h-3 w-3 text-green-500" />
									<span>Uploaded: {formatBytes(download.uploaded)}</span>
								</div>
							)}
						</div>
					)}

					{isNone && <p className="text-muted-foreground text-sm">No Status</p>}

					{isRemoved && (
						<p className="text-muted-foreground text-sm">Removed</p>
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
