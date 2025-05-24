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
		onSuccess: async (data) => {
			await utils.downloads.invalidate(undefined, {
				refetchType: "all",
				type: "all",
			});
			toast.success("Download added");
			return data;
		},
		onError: (error) => {
			toast.error(`Failed to add download: ${error.message}`);
		},
	});

	// Pause download
	const { mutate: pauseDownload, isPending: isPausingDownload } =
		trpc.downloads.pause.useMutation({
			onSuccess: async () => {
				await utils.downloads.invalidate(undefined, {
					refetchType: "all",
					type: "all",
				});
				toast.success("Download paused");
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
			onSuccess: async () => {
				await utils.downloads.invalidate(undefined, {
					refetchType: "all",
					type: "all",
				});
				toast.success("Download resumed");
			},
			onError: (error) => {
				toast.error(`Failed to resume download: ${error.message}`);
			},
		});

	// Cancel download
	const { mutate: cancelDownload, isPending: isCancellingDownload } =
		trpc.downloads.cancel.useMutation({
			onSuccess: async () => {
				await utils.downloads.invalidate(undefined, {
					refetchType: "all",
					type: "all",
				});
				toast.success("Download cancelled");
			},
			onError: (error) => {
				toast.error(`Failed to cancel download: ${error.message}`);
			},
		});

	// Remove download
	const { mutate: removeDownload, isPending: isRemovingDownload } =
		trpc.downloads.remove.useMutation({
			onSuccess: async () => {
				await utils.downloads.invalidate(undefined, {
					refetchType: "all",
					type: "all",
				});
				toast.success("Download removed");
			},
			onError: (error) => {
				toast.error(`Failed to remove download: ${error.message}`);
			},
		});

	// Clear completed downloads
	const { mutate: clearCompletedDownloads, isPending: isClearingCompleted } =
		trpc.downloads.clearCompleted.useMutation({
			onSuccess: async (data) => {
				await utils.downloads.invalidate(undefined, {
					refetchType: "all",
					type: "all",
				});
				toast.success(`Cleared ${data.count} completed downloads`);
			},
			onError: (error) => {
				toast.error(`Failed to clear completed downloads: ${error.message}`);
			},
		});

	// Set download priority
	const { mutate: setPriority, isPending: isSettingPriority } =
		trpc.downloads.setPriority.useMutation({
			onSuccess: async () => {
				await utils.downloads.invalidate(undefined, {
					refetchType: "all",
					type: "all",
				});
				toast.success("Download priority updated");
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
