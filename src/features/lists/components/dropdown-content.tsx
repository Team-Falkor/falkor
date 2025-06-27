import { FolderPlus, Loader2, PlusIcon } from "lucide-react";
import type { IGDBReturnDataType } from "@/@types";
import { DialogTrigger } from "@/components/ui/dialog";
import {
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { P, TypographyMuted } from "@/components/ui/typography";
import { useLanguageContext } from "@/i18n/I18N";
import { cn } from "@/lib/utils";
import { useLists } from "../hooks/use-lists";
import ListsDropdownItem from "./dropdown-item";

type Props = IGDBReturnDataType & {
	align?: "start" | "end" | "center" | undefined;
};

const ListsDropdownContent = (props: Props) => {
	const { t } = useLanguageContext();
	const { lists, isLoading, error } = useLists();

	if (isLoading) {
		return (
			<DropdownMenuContent className="w-96" align={props?.align ?? "start"}>
				<div className="flex items-center justify-center gap-2 p-6">
					<Loader2 className="size-5 animate-spin text-muted-foreground" />
					<TypographyMuted>{t("loading")}</TypographyMuted>
				</div>
			</DropdownMenuContent>
		);
	}

	if (error) return null;

	return (
		<DropdownMenuContent
			className="w-96 p-2"
			align={props?.align ?? "start"}
			sideOffset={8}
		>
			{/* Header */}
			<div className="mb-2 px-3 py-2">
				<DropdownMenuLabel className="p-0 font-semibold text-foreground text-sm">
					{t("add-to-list")}
				</DropdownMenuLabel>
				<TypographyMuted className="mt-1 text-xs">
					{t("select_lists_to_add_game")}
				</TypographyMuted>
			</div>

			<DropdownMenuSeparator className="mb-2" />

			{/* Lists Container */}
			<div
				className={cn(
					"space-y-1",
					lists?.length ? "max-h-64 overflow-y-auto" : "",
				)}
			>
				{!lists?.length ? (
					<div className="flex flex-col items-center justify-center gap-3 px-4 py-8">
						<div className="rounded-full bg-muted/50 p-3">
							<FolderPlus className="size-6 text-muted-foreground" />
						</div>
						<div className="space-y-1 text-center">
							<P className="font-medium text-sm">{t("no_lists_yet")}</P>
							<TypographyMuted className="text-xs">
								{t("create_your_first_list")}
							</TypographyMuted>
						</div>
					</div>
				) : (
					lists.map((list) => (
						<ListsDropdownItem key={list.id} listId={list.id} game={props}>
							{list.name}
						</ListsDropdownItem>
					))
				)}
			</div>

			{/* Create New List Button */}
			<div className="mt-2">
				<DropdownMenuSeparator className="mb-2" />
				<DropdownMenuItem
					className={cn(
						"flex items-center gap-3 rounded-md px-3 py-2.5",
						"hover:bg-primary/10 focus:bg-primary/10",
						"cursor-pointer transition-colors duration-200",
					)}
				>
					<DialogTrigger className="flex w-full items-center gap-3">
						<div className="rounded-md bg-primary/10 p-1.5">
							<PlusIcon className="size-4 text-primary" />
						</div>
						<div className="flex-1 text-left">
							<P className="font-medium text-sm">{t("create_new_list")}</P>
							<TypographyMuted className="text-xs">
								{t("organize_your_games")}
							</TypographyMuted>
						</div>
					</DialogTrigger>
				</DropdownMenuItem>
			</div>
		</DropdownMenuContent>
	);
};

export default ListsDropdownContent;
