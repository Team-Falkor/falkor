import { Loader2, TrashIcon } from "lucide-react";
import { type PropsWithChildren, useCallback } from "react";
import { toast } from "sonner";
import type { IGDBReturnDataType } from "@/@types";
import Confirmation from "@/components/confirmation";
import { Button } from "@/components/ui/button";
import { DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { P } from "@/components/ui/typography";
import { useLanguageContext } from "@/i18n/I18N";
import { getSteamIdFromWebsites, trpc } from "@/lib";
import { cn } from "@/lib/utils";

interface CollectionDropdownItemProps extends PropsWithChildren {
	listId: number;
	game: IGDBReturnDataType;
}

const ListsDropdownItem = ({
	children,
	listId,
	game,
}: CollectionDropdownItemProps) => {
	const { t } = useLanguageContext();
	const utils = trpc.useUtils();
	const { data: gamesInList, isLoading: loading } =
		trpc.lists.getByIdWithGames.useQuery(listId);
	const addGameToList = trpc.lists.addGame.useMutation({
		onSuccess: () => {
			utils.lists.getByIdWithGames.invalidate(listId);
			toast.success("Game added to list");
		},
		onError: () => {
			toast.error("Failed to add game to list");
		},
	});
	const removeGameFromList = trpc.lists.removeGame.useMutation({
		onSuccess: () => {
			utils.lists.getByIdWithGames.invalidate(listId);
			toast.success("Game removed from list");
		},
		onError: () => {
			toast.error("Failed to remove game from list");
		},
	});
	const deleteList = trpc.lists.delete.useMutation({
		onSuccess: () => {
			utils.lists.getAll.invalidate(undefined, {
				refetchType: "all",
				type: "all",
			});
			toast.success("List deleted");
		},
		onError: () => {
			toast.error("Failed to delete list");
		},
	});

	const games = Array.isArray(gamesInList?.games) ? gamesInList.games : [];

	const handleSelect = useCallback(async () => {
		const gameExists = games.some((g) => g.igdbId === game.id);
		if (gameExists) {
			removeGameFromList.mutate({ listId, gameId: game.id });
		} else {
			addGameToList.mutate({
				listId: listId,
				gameId: game.id,
				gameName: game.name,
				gameIcon: game.cover?.url,
				gameSteamId: getSteamIdFromWebsites(game?.websites),
			});
		}
	}, [games, listId, game, addGameToList, removeGameFromList]);

	const isGameInList = games.some((g) => g.igdbId === game.id);
	const isProcessing = addGameToList.isPending || removeGameFromList.isPending;
	const isDeleting = deleteList.isPending;

	return (
		<div className="flex items-center justify-between gap-2 py-1">
			<div className="min-w-0 flex-1">
				<DropdownMenuCheckboxItem
					checked={isGameInList}
					onSelect={handleSelect}
					disabled={loading || isProcessing}
					className={cn(
						"relative flex items-center rounded-md py-2.5 transition-all duration-200",
						"focus-states:bg-accent/50 focus:bg-accent/50",
						"disabled:cursor-not-allowed disabled:opacity-50",
						isProcessing && "cursor-wait",
						isGameInList ? "pl-9" : "pl-2",
					)}
				>
					<div className="flex min-w-0 flex-1 items-center gap-3">
						{isProcessing && (
							<Loader2 className="size-4 animate-spin text-muted-foreground" />
						)}
						<div className="min-w-0 flex-1">
							<P
								className={cn(
									"truncate font-medium transition-colors",
									isGameInList ? "text-white" : "text-muted-foreground",
								)}
							>
								{children || game.name}
							</P>
							{isGameInList && (
								<P className="mt-0.5 text-muted-foreground text-xs">
									{t("added")}
								</P>
							)}
						</div>
					</div>
				</DropdownMenuCheckboxItem>
			</div>

			<div className="flex items-center">
				<Confirmation
					onConfirm={async () => {
						deleteList.mutate(listId);
					}}
					title={`${t("delete")} ${t("list")}`}
					description={t("are_you_absolutely_sure_list_delete_description")}
				>
					<Button
						size="icon"
						variant="ghost"
						className={cn(
							"size-8 text-muted-foreground focus-states:bg-destructive/10 focus-states:text-destructive",
							"rounded-md transition-all duration-200",
							isDeleting && "cursor-wait",
						)}
						disabled={isDeleting}
					>
						{isDeleting ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<TrashIcon className="size-4" />
						)}
					</Button>
				</Confirmation>
			</div>
		</div>
	);
};

export default ListsDropdownItem;
