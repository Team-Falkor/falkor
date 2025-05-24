import Confirmation from "@/components/confirmation";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useLanguageContext } from "@/i18n/I18N";
import { trpc } from "@/lib";

interface DeleteDialogProps {
	gameId: string;
}

const DeleteDialog = ({ gameId }: DeleteDialogProps) => {
	const { t } = useLanguageContext();
	const utils = trpc.useUtils();

	const invalidate = async () => {
		await utils.invalidate(undefined, {
			refetchType: "all",
			type: "all",
			exact: false,
			stale: true,
		});
	};

	const { mutate: deleteGame } = trpc.library.delete.useMutation({
		onSuccess: async () => {
			await invalidate();
		},
	});

	return (
		<Confirmation
			onConfirm={async () => {
				deleteGame({ id: Number.parseInt(gameId) });
				await invalidate();
			}}
		>
			<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
				{t("delete")}
			</DropdownMenuItem>
		</Confirmation>
	);
};

export default DeleteDialog;
