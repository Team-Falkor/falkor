import Confirmation from "@/components/confirmation";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib";

type Props = {
	id: number;
};

export const DeleteAccount = ({ id }: Props) => {
	const utils = trpc.useUtils();

	const { mutate } = trpc.accounts.delete.useMutation({
		onSuccess: async () => {
			await utils.accounts.invalidate(undefined, {
				refetchType: "all",
				type: "all",
			});
		},
	});

	return (
		<Confirmation
			onConfirm={() => mutate(id)}
			title="Are you sure?"
			description="This will delete the account and all associated data."
		>
			<Button
				variant="ghost"
				className="size-fit w-full items-start justify-start bg-none"
			>
				Delete
			</Button>
		</Confirmation>
	);
};
