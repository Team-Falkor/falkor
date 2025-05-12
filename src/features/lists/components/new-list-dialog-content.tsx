import { type Dispatch, type SetStateAction, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguageContext } from "@/i18n/I18N";
import { useLists } from "../hooks/use-lists";

interface NewListDialogProps {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
}

export const NewListDialogContent = ({ open, setOpen }: NewListDialogProps) => {
	const { t } = useLanguageContext();
	const { createList, isCreating } = useLists();

	const listNameRef = useRef<HTMLInputElement>(null);
	const listDescriptionRef = useRef<HTMLTextAreaElement>(null);

	return (
		<DialogContent className="max-w-[425px]">
			<DialogHeader>
				<DialogTitle>{t("create_new_list")}</DialogTitle>
				<DialogDescription>
					{t("fill_in_the_information_below_to_create_a_new_list")}
				</DialogDescription>
			</DialogHeader>

			<div className="grid gap-4 pt-2">
				<Label htmlFor="collectionName">Name</Label>
				<Input
					ref={listNameRef}
					id="listName"
					placeholder={t("enter_list_name")}
					type="text"
					className="w-full"
					minLength={1}
					maxLength={64}
					autoComplete={"off"}
					// disabled={loading}
				/>
			</div>

			<div className="grid gap-4 pt-2">
				<Label htmlFor="collectionDescription">Description</Label>
				<Textarea
					ref={listDescriptionRef}
					id="listDescription"
					placeholder={t("enter_list_description")}
					className="field-sizing-content w-full resize-none"
					minLength={1}
					maxLength={64}
					autoComplete={"off"}
				/>
			</div>

			<DialogFooter>
				<DialogClose asChild>
					<Button variant={"destructive"}>Cancel</Button>
				</DialogClose>
				<Button
					onClick={async () => {
						if (!open) return;
						if (!listNameRef.current?.value) return;
						await createList({
							name: listNameRef.current.value,
							description: listDescriptionRef.current?.value ?? "",
						});

						setOpen(false);
					}}
					disabled={isCreating}
				>
					{isCreating ? "Creating..." : "Create"}
				</Button>
			</DialogFooter>
		</DialogContent>
	);
};
