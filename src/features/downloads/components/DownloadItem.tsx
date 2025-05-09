import { DownloadStatus } from "@/@types/download/queue";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { formatBytes, formatTimeRemaining } from "@/lib/utils";

interface DownloadItemProps {
	id: string;
	name: string;
	progress: number;
	status: DownloadStatus;
	speed: number;
	size: number;
	timeRemaining: number;
}

export function DownloadItem({
	id,
	name,
	progress,
	status,
	speed,
	size,
	timeRemaining,
}: DownloadItemProps) {
	const utils = trpc.useUtils();
	const pauseMutation = trpc.downloads.pause.useMutation({
		onSuccess: () => utils.downloads.getAll.invalidate(),
	});
	const resumeMutation = trpc.downloads.resume.useMutation({
		onSuccess: () => utils.downloads.getAll.invalidate(),
	});
	const cancelMutation = trpc.downloads.cancel.useMutation({
		onSuccess: () => utils.downloads.getAll.invalidate(),
	});

	const handlePause = () => pauseMutation.mutate({ id });
	const handleResume = () => resumeMutation.mutate({ id });
	const handleCancel = () => cancelMutation.mutate({ id });
	const isActive = status === DownloadStatus.DOWNLOADING;
	const isPaused = status === DownloadStatus.PAUSED;
	const isCompleted = status === DownloadStatus.COMPLETED;
	const isFailed = status === DownloadStatus.FAILED;

	return (
		<Card className="space-y-3 p-4">
			<div className="flex items-center justify-between">
				<div className="flex-1">
					<h3 className="truncate font-medium">{name}</h3>
					<div className="flex items-center gap-2 text-muted-foreground text-sm">
						{isActive && (
							<>
								<span>{formatBytes(speed)}/s</span>
								<span>•</span>
								<span>{formatTimeRemaining(timeRemaining)}</span>
							</>
						)}
						<span>{formatBytes(size)}</span>
					</div>
				</div>
				<div className="flex items-center gap-2">
					{!isCompleted && !isFailed && (
						<button
							onClick={() => (isPaused ? handleResume() : handlePause())}
							className="font-medium text-sm hover:underline"
						>
							{isPaused ? "Resume" : "Pause"}
						</button>
					)}
					{!isCompleted && (
						<button
							onClick={handleCancel}
							className="font-medium text-destructive text-sm hover:underline"
						>
							Cancel
						</button>
					)}
					<Badge
						variant={
							isCompleted ? "default" : isPaused ? "secondary" : "outline"
						}
					>
						{status}
					</Badge>
				</div>
			</div>
			{!isCompleted && !isFailed && (
				<Progress value={progress} className="h-2" />
			)}
		</Card>
	);
}
