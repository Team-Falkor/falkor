import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { H3 } from "@/components/ui/typography";
import { trpc } from "@/lib";

interface TorBoxContentProps {
	open: boolean;
	setOpen: (v: boolean) => void;
}

export default function TorBoxDialogContent({
	open,
	setOpen,
}: TorBoxContentProps) {
	const [apiKey, setApiKey] = useState("");
	const addAccount = trpc.accounts.create.useMutation();
	const validateKey = trpc.torbox.auth.validateKey.useMutation();

	const utils = trpc.useUtils();

	const handleSave = async () => {
		const key = apiKey.trim();
		if (!key) {
			toast.error("API key cannot be empty");
			return;
		}

		const result = await validateKey.mutateAsync({ apiKey: key });

		if ("error" in result) {
			toast.error(result.error.message);
			return;
		}
		const user = result.user;
		const email = user?.email;

		const ok = await addAccount.mutateAsync({
			username: email ?? undefined,
			email: email ?? undefined,
			clientId: undefined,
			clientSecret: key,
			accessToken: key,
			refreshToken: key,
			expiresIn: -1,
			type: "torbox",
		});

		if (ok) {
			toast.success("TorBox account added");

			// Invalidate the accounts list
			await utils.accounts.invalidate();
			setOpen(false);
		} else {
			toast.error("Failed to add TorBox account");
		}
	};

	if (!open) return null;
	return (
		<DialogContent>
			<DialogTitle>TorBox</DialogTitle>
			<div className="flex flex-col gap-3">
				<H3>Enter your TorBox API key:</H3>
				<Input
					value={apiKey}
					onChange={(e) => setApiKey(e.currentTarget.value)}
					placeholder="API Key"
				/>
				<div className="mt-3 flex justify-end gap-3">
					<Button variant="destructive" onClick={() => setOpen(false)}>
						Cancel
					</Button>
					<Button
						variant="success"
						onClick={handleSave}
						disabled={validateKey.status === "pending"}
					>
						{validateKey.status === "pending" ? "Checking…" : "Save"}
					</Button>
				</div>
			</div>
		</DialogContent>
	);
}
