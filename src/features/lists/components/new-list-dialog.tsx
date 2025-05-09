import type { Dispatch, ReactNode, SetStateAction } from "react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { NewListDialogContent } from "./new-list-dialog-content";

interface NewListDialogProps {
	children: ReactNode;
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
}

export const NewListDialog = ({
	children,
	open,
	setOpen,
}: NewListDialogProps) => {
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>

			<NewListDialogContent open={open} setOpen={setOpen} />
		</Dialog>
	);
};
