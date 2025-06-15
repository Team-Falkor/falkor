import { format } from "date-fns";
import { useEffect, useState } from "react";
import { UpdateStatus } from "@/@types";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { H5, TypographyMuted } from "@/components/ui/typography";
import { useUpdater } from "@/hooks";
import { useLanguageContext } from "@/i18n/I18N";
import { parseHtmlString, trpc } from "@/lib";

const getOrdinal = (day: number): string => {
	if (day > 3 && day < 21) return "th";
	switch (day % 10) {
		case 1:
			return "st";
		case 2:
			return "nd";
		case 3:
			return "rd";
		default:
			return "th";
	}
};

const formatWithOrdinal = (date: Date): string => {
	const day = date.getDate();
	const ordinal = getOrdinal(day);
	return `${day}${ordinal} ${format(date, "LLLL, yyyy")}`;
};

const Updater = () => {
	const { t } = useLanguageContext();
	const { status, updateInfo, progress, downloadUpdate, installUpdate } =
		useUpdater();

	const [hasBeenDismissed, setHasBeenDismissed] = useState(false);

	const { data: appInfo, isPending, isError } = trpc.app.appInfo.useQuery();

	const isDownloading = status === UpdateStatus.DOWNLOADING;
	const isDownloaded = status === UpdateStatus.DOWNLOADED;

	const isDialogOpen =
		(status === UpdateStatus.UPDATE_AVAILABLE ||
			isDownloading ||
			isDownloaded) &&
		!hasBeenDismissed;

	useEffect(() => {
		if (status === UpdateStatus.IDLE) {
			setHasBeenDismissed(false);
		}
	}, [status]);

	if (!isDialogOpen) {
		return null;
	}

	return (
		<Dialog
			open={isDialogOpen}
			onOpenChange={(open) => !open && setHasBeenDismissed(true)}
		>
			<DialogContent
				onInteractOutside={(e) => {
					if (isDownloading) {
						e.preventDefault();
					}
				}}
			>
				<DialogHeader>
					<DialogTitle>
						{isDownloaded
							? t("update_ready_to_install")
							: t("update_available")}
					</DialogTitle>
					<DialogDescription>
						{isDownloaded
							? t("update_ready_description")
							: t("update_description")}
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col">
					{appInfo && !isPending && !isError && appInfo.appVersion && (
						<div className="flex flex-row items-end gap-2">
							<TypographyMuted className="min-w-28">
								{t("current_version")}:
							</TypographyMuted>
							<H5 className="font-bold capitalize">{appInfo.appVersion}</H5>
						</div>
					)}

					{updateInfo?.version && (
						<div className="flex flex-row items-end gap-2">
							<TypographyMuted className="min-w-28">
								{t("new_version")}:
							</TypographyMuted>
							<H5 className="font-bold capitalize">{updateInfo.version}</H5>
						</div>
					)}

					{updateInfo?.releaseDate && (
						<div className="flex flex-row items-end gap-2">
							<TypographyMuted className="min-w-28">
								{t("release_date")}:
							</TypographyMuted>
							<H5 className="font-bold text-lg capitalize">
								{formatWithOrdinal(new Date(updateInfo.releaseDate))}
							</H5>
						</div>
					)}

					{updateInfo?.releaseNotes && (
						<div className="mt-4 flex flex-col gap-2">
							<TypographyMuted className="min-w-28">
								{t("changelog")}:
							</TypographyMuted>
							<ScrollArea className="h-[200px] w-full rounded-md border p-4">
								<div className="prose prose-sm dark:prose-invert">
									{parseHtmlString(updateInfo.releaseNotes)}
								</div>
							</ScrollArea>
						</div>
					)}

					{isDownloading && (
						<div className="mt-4 flex flex-col items-center gap-2">
							<Progress value={progress} />
							<TypographyMuted>{`${t("downloading_update")}... ${progress}%`}</TypographyMuted>
						</div>
					)}
				</div>
				<DialogFooter>
					{isDownloaded ? (
						<Button className="w-full" onClick={installUpdate}>
							{t("restart_and_install")}
						</Button>
					) : (
						<>
							<Button
								variant="destructive"
								onClick={() => setHasBeenDismissed(true)}
								disabled={isDownloading}
							>
								{t("later")}
							</Button>
							<Button onClick={downloadUpdate} disabled={isDownloading}>
								{isDownloading ? t("updating") : t("update_now")}
							</Button>
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default Updater;
