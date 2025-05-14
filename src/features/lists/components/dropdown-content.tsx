import { PlusIcon } from "lucide-react";
import type { IGDBReturnDataType } from "@/@types";
import { DialogTrigger } from "@/components/ui/dialog";
import {
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { P } from "@/components/ui/typography";
import { useLanguageContext } from "@/i18n/I18N";
import { useLists } from "../hooks/use-lists";
import ListsDropdownItem from "./dropdown-item";

type Props = IGDBReturnDataType & {
	align?: "start" | "end" | "center" | undefined;
};

const ListsDropdownContent = (props: Props) => {
	const { t } = useLanguageContext();
	const { lists, isLoading, error } = useLists();

	if (isLoading) return <div>Loading...</div>;
	if (error) return null;

	return (
		<DropdownMenuContent className="max-w-sm" align={props?.align ?? "start"}>
			<DropdownMenuLabel className="w-full truncate">
				{t("add-to-list")}
			</DropdownMenuLabel>

			<DropdownMenuSeparator />

			<div className="max-h-24 overflow-y-auto">
				{!lists?.length ? (
					<div className="flex items-center justify-center gap-2 p-2">
						<P className="text-center">{t("create_new_list")}</P>
					</div>
				) : (
					lists.map((list) => (
						<ListsDropdownItem key={list.id} listId={list.id} game={props}>
							{list.name}
						</ListsDropdownItem>
					))
				)}
			</div>

			<DropdownMenuSeparator />

			<DropdownMenuItem>
				<DialogTrigger>
					<div className="flex items-center gap-1.5">
						<PlusIcon className="size-5 " />
						<P>Create a new list</P>
					</div>
				</DialogTrigger>
			</DropdownMenuItem>
		</DropdownMenuContent>
	);
};

export default ListsDropdownContent;
