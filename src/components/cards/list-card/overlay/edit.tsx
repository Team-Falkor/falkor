import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Game } from "@/@types";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { GameForm } from "@/features/library/components/game-form";
import { useLanguageContext } from "@/i18n/I18N";
import { trpc } from "@/lib";

interface UpdateDialogProps {
	game: Game;
}

const UpdateDialog = ({ game: initialGame }: UpdateDialogProps) => {
	const [open, setOpen] = useState(false);
	const [editedGame, setEditedGame] = useState<Partial<Game>>(initialGame);

	const { t } = useLanguageContext();
	const utils = trpc.useUtils();
	const openDialog = trpc.app.openDialog.useMutation();

	useEffect(() => {
		if (open) {
			setEditedGame(initialGame);
		}
	}, [open, initialGame]);

	const { mutate: updateGameMutation, isPending: isUpdating } =
		trpc.library.update.useMutation({
			onSuccess: async () => {
				await utils.library.invalidate(undefined, {
					refetchType: "all",
					type: "all",
				});
				toast.success(t("game_updated_successfully"));
				setOpen(false);
			},
			onError: (error) => {
				console.error("Error updating game:", error);
				toast.error(`${t("error_updating_game")}: ${error.message}`);
			},
		});

	const handleGameChange = useCallback((updatedFields: Partial<Game>) => {
		setEditedGame((prev) => ({ ...prev, ...updatedFields }));
	}, []);

	const handleFileBrowse = useCallback(
		async (
			config: {
				properties: ("openFile" | "openDirectory")[];
				filters: { name: string; extensions: string[] }[];
			},
			updateKey: keyof Game,
		) => {
			try {
				const selected = await openDialog.mutateAsync(config);
				if (
					selected.canceled ||
					!selected.success ||
					selected.filePaths.length === 0
				) {
					console.log("File selection canceled or failed.");
					return;
				}

				const path = selected.filePaths[0];
				setEditedGame(
					(prev) => ({ ...prev, [updateKey]: path }) as Partial<Game>,
				);
			} catch (error) {
				console.error("Error opening file dialog:", error);
				toast.error(t("error_opening_file_dialog"));
			}
		},
		[openDialog, t],
	);

	const handleUpdateSubmit = () => {
		if (!editedGame.gameId) {
			toast.error(t("game_id_missing"));
			return;
		}

		if (!editedGame.gameName || !editedGame.gamePath) {
			toast.error(t("game_name_or_path_missing"));
			return;
		}

		updateGameMutation({
			id: initialGame.id,
			data: {
				gameId: editedGame.gameId,
				gameName: editedGame.gameName,
				gamePath: editedGame.gamePath,
				gameArgs: editedGame.gameArgs ?? undefined,
				gameIcon: editedGame.gameIcon ?? undefined,
				gameCommand: editedGame.gameCommand ?? undefined,
				igdbId: editedGame.igdbId ? editedGame.igdbId : undefined,
				gameSteamId: editedGame.gameSteamId ?? undefined,
				winePrefixFolder: editedGame.winePrefixFolder ?? undefined,
				runAsAdmin: editedGame.runAsAdmin,
			},
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
					{t("update")}
				</DropdownMenuItem>
			</DialogTrigger>
			<DialogContent className="flex h-[85vh] w-full flex-col sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle>{t("update_game")}</DialogTitle>
				</DialogHeader>

				<GameForm
					game={editedGame}
					onGameChange={handleGameChange}
					onFileBrowse={handleFileBrowse}
				/>

				<DialogFooter className="flex-shrink-0 pt-4">
					<Button variant="outline" onClick={() => setOpen(false)}>
						{t("cancel")}
					</Button>
					<Button onClick={handleUpdateSubmit} disabled={isUpdating}>
						{isUpdating ? `${t("saving")}...` : t("save_changes")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default UpdateDialog;
