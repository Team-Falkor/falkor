import { toast } from "sonner";
import { trpc } from "@/lib";

export const useDownloadActions = () => {
	const utils = trpc.useUtils();

	// Add download
	const {
		mutate: addDownload,
		isPending: isAddingDownload,
		error: addDownloadError,
	} = trpc.downloads.add.useMutation({
		onSuccess: (data) => {
			toast.success("Download added");
			utils.downloads.getAll.invalidate();
			return data;
		},
		onError: (error) => {
			toast.error(`Failed to add download: ${error.message}`);
		},
	});

	// Pause download
	const { mutate: pauseDownload, isPending: isPausingDownload } =
		trpc.downloads.pause.useMutation({
			onSuccess: () => {
				toast.success("Download paused");
				utils.downloads.getAll.invalidate();
			},
			onError: (error) => {
				toast.error("Failed to pause download", {
					description: error.message,
				});
			},
		});

	// Resume download
	const { mutate: resumeDownload, isPending: isResumingDownload } =
		trpc.downloads.resume.useMutation({
			onSuccess: () => {
				toast.success("Download resumed");
				utils.downloads.getAll.invalidate();
			},
			onError: (error) => {
				toast.error(`Failed to resume download: ${error.message}`);
			},
		});

	// Cancel download
	const { mutate: cancelDownload, isPending: isCancellingDownload } =
		trpc.downloads.cancel.useMutation({
			onSuccess: () => {
				toast.success("Download cancelled");
				utils.downloads.getAll.invalidate();
			},
			onError: (error) => {
				toast.error(`Failed to cancel download: ${error.message}`);
			},
		});

	// Remove download
	const { mutate: removeDownload, isPending: isRemovingDownload } =
		trpc.downloads.remove.useMutation({
			onSuccess: async () => {
				await utils.downloads.getAll.invalidate();
				toast.success("Download removed");
			},
			onError: (error) => {
				toast.error(`Failed to remove download: ${error.message}`);
			},
		});

	// Clear completed downloads
	const { mutate: clearCompletedDownloads, isPending: isClearingCompleted } =
		trpc.downloads.clearCompleted.useMutation({
			onSuccess: (data) => {
				toast.success(`Cleared ${data.count} completed downloads`);
				utils.downloads.getAll.invalidate();
			},
			onError: (error) => {
				toast.error(`Failed to clear completed downloads: ${error.message}`);
			},
		});

	// Set download priority
	const { mutate: setPriority, isPending: isSettingPriority } =
		trpc.downloads.setPriority.useMutation({
			onSuccess: () => {
				toast.success("Download priority updated");
				utils.downloads.getAll.invalidate();
			},
			onError: (error) => {
				toast.error(`Failed to update priority: ${error.message}`);
			},
		});

	// Update download queue configuration
	const { mutate: updateConfig, isPending: isUpdatingConfig } =
		trpc.downloads.updateConfig.useMutation({
			onSuccess: () => {
				toast.success("Download configuration updated");
			},
			onError: (error) => {
				toast.error(`Failed to update configuration: ${error.message}`);
			},
		});

	return {
		// Mutations
		addDownload,
		pauseDownload,
		resumeDownload,
		cancelDownload,
		removeDownload,
		clearCompletedDownloads,
		setPriority,
		updateConfig,

		// Loading states
		isAddingDownload,
		isPausingDownload,
		isResumingDownload,
		isCancellingDownload,
		isRemovingDownload,
		isClearingCompleted,
		isSettingPriority,
		isUpdatingConfig,

		// Errors
		addDownloadError,
	};
};
