import { TrashIcon } from "lucide-react";
import { type PropsWithChildren, useCallback } from "react";
import { toast } from "sonner";
import type { IGDBReturnDataType } from "@/@types";
import Confirmation from "@/components/confirmation";
import { Button } from "@/components/ui/button";
import { DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { P } from "@/components/ui/typography";
import { getSteamIdFromWebsites, trpc } from "@/lib";

interface CollectionDropdownItemProps extends PropsWithChildren {
	listId: number;
	game: IGDBReturnDataType;
}

const ListsDropdownItem = ({
	children,
	listId,
	game,
}: CollectionDropdownItemProps) => {
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
		// biome-ignore lint/suspicious/noExplicitAny: TODO FIX LATER
		const gameExists = games.some((g: any) => g.gameId === game.id);
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

	return (
		<div className="flex flex-row items-center justify-between gap-1">
			<div className="flex-1">
				<DropdownMenuCheckboxItem
					checked={games.some((g) => g.igdbId === game.id)}
					onSelect={handleSelect}
					disabled={loading || addGameToList.isPending}
				>
					<P className="truncate">{children || game.name}</P>
				</DropdownMenuCheckboxItem>
			</div>
			<div className="flex pr-1">
				<Confirmation
					onConfirm={async () => {
						deleteList.mutate(listId);
					}}
					description="are_you_absolutely_sure_list_delete_description"
				>
					<Button size={"icon"} variant={"ghost"} className="size-5">
						<TrashIcon className="size-5" />
					</Button>
				</Confirmation>
			</div>
		</div>
	);
};

export default ListsDropdownItem;
