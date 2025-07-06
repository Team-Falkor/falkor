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

	const { mutate: deleteGame } = trpc.library.delete.useMutation({
		onSuccess: async () => {
			await utils.invalidate(undefined, {
				refetchType: "all",
				type: "all",
			});
		},
	});

	return (
		<Confirmation onConfirm={() => deleteGame({ gameId })}>
			<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
				{t("remove")}
			</DropdownMenuItem>
		</Confirmation>
	);
};

export default DeleteDialog;
