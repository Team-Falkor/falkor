import { type Dispatch, type SetStateAction, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { H3 } from "@/components/ui/typography";
import { trpc } from "@/lib";

interface TorBoxDialogContentProps {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
	onAuthenticated?: (token: string) => void;
}

const TorBoxDialogContent = ({ open, setOpen }: TorBoxDialogContentProps) => {
	const utils = trpc.useUtils();

	const [apiKey, setApiKey] = useState<string>("");

	const { mutateAsync: addAccount } = trpc.accounts.create.useMutation({
		async onSuccess(data) {
			if (!data) {
				toast.error("Failed to add TorBox account");
				return;
			}

			await utils.accounts.invalidate(undefined, {
				refetchType: "all",
				type: "all",
			});

			toast.success("TorBox account added successfully");
			setOpen(false);
		},
		onError(data) {
			toast.error("An error occurred while adding the TorBox account", {
				description: data.message,
			});
		},
	});

	const handleSave = async () => {
		if (!apiKey.trim()) {
			toast.error("API key cannot be empty");
			return;
		}

		try {
			await addAccount({
				avatar: undefined,
				clientId: undefined,
				clientSecret: apiKey.trim(),
				accessToken: apiKey.trim(),
				refreshToken: apiKey.trim(),
				expiresIn: -1,
				type: "torbox",
			});
		} catch (error) {
			console.error("Failed to save TorBox account:", error);
			toast.error("An error occurred while adding the TorBox account");
		}
	};

	const handleClose = () => {
		setApiKey(""); // Reset API key input
		setOpen(false);
	};

	if (!open) return null; // Do not render the component if 'open' is false

	return (
		<DialogContent>
			<DialogTitle>TorBox</DialogTitle>
			<div className="flex flex-col gap-3">
				<H3>Please enter your TorBox API key below:</H3>
				<Input
					type="text"
					value={apiKey}
					onChange={(e) => setApiKey(e.target.value)}
					placeholder="Enter API key"
				/>
				<div className="mt-3 flex justify-end gap-3">
					<Button onClick={handleClose} variant={"destructive"}>
						Cancel
					</Button>
					<Button onClick={handleSave} variant={"success"}>
						Save
					</Button>
				</div>
			</div>
		</DialogContent>
	);
};

export default TorBoxDialogContent;
