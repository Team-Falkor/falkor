import { UserIcon } from "lucide-react";
import { toast } from "sonner";
import type { RouterOutputs } from "@/@types";
import { Card, CardContent } from "@/components/ui/card";
import { useSettings } from "@/features/settings/hooks/useSettings";
import { trpc } from "@/lib";
import { AccountCard } from "./account-card";

type Account = RouterOutputs["accounts"]["getAll"];

type Props = {
	accounts: Account;
};

export const AccountsDisplay = ({ accounts }: Props) => {
	const { settings, updateSetting } = useSettings();

	const utils = trpc.useUtils();
	const { mutate: deleteAccount } = trpc.accounts.delete.useMutation({
		onSuccess: async () => {
			await utils.accounts.invalidate(undefined, {
				refetchType: "all",
				type: "all",
			});

			toast.success("Account deleted");
		},

		onError: (error) => {
			toast.error("Error deleting account", {
				description: error.message,
			});
		},
	});

	if (accounts.length === 0) {
		return (
			<Card className="w-full transition-shadow hover:shadow-md">
				<CardContent className="flex flex-col items-center justify-center py-12">
					<UserIcon className="mb-4 h-12 w-12 text-muted-foreground" />
					<p className="font-medium text-lg text-muted-foreground">
						No accounts found
					</p>
					<p className="text-muted-foreground text-sm">
						Add an account to get started
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		// Added 'items-start' to prevent vertical stretching of grid items
		<div className="grid grid-cols-[repeat(auto-fill,minmax(500px,1fr))] items-start gap-4">
			{accounts?.map((account) => {
				const isPreferred = settings?.preferredDebridService === account.type;

				return (
					<AccountCard
						key={account.id}
						account={{
							...account,
							isPreferred,
						}}
						onDelete={async (id) => {
							if (!id) return;
							deleteAccount(id);
						}}
						onSetPreferred={(type) => {
							if (!type) return;
							updateSetting({
								path: "preferredDebridService",
								value: type,
							});
						}}
					/>
				);
			})}
		</div>
	);
};
