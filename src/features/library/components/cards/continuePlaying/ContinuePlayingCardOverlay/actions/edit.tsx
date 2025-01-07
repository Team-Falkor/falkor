import { LibraryGame, LibraryGameUpdate } from "@/@types/library/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useLanguageContext } from "@/contexts/I18N";
import UpdateGameForm from "@/features/library/components/updateForm";

interface UpdateDialogProps {
  updateGame: (gameId: string, updates: LibraryGameUpdate) => void;
  fetchGames: () => void;
  game: LibraryGame;
}

const UpdateDialog = ({ fetchGames, updateGame, game }: UpdateDialogProps) => {
  const { t } = useLanguageContext();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          {t("update")}
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="h-[calc(100vh-10rem)] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("update_game")}</DialogTitle>
        </DialogHeader>

        <UpdateGameForm
          onSubmit={(values) => {
            updateGame(game.game_id, {
              game_args: values.gameArgs,
              game_command: values.gameCommand,
              game_icon: values.gameIcon,
              game_name: values.gameName,
              game_path: values.gamePath,
              igdb_id: values.igdbId ? Number(values.igdbId) : undefined,
              wine_prefix_folder: values.winePrefixFolder,
              game_steam_id: values.steamId,
            });
            fetchGames();
            return;
          }}
          defaultValues={{
            gameArgs: game.game_args,
            gameCommand: game.game_command,
            gameName: game.game_name,
            gamePath: game.game_path,
            gameIcon: game.game_icon ?? "",
            igdbId: game.igdb_id?.toString() ?? "",
            winePrefixFolder: game.wine_prefix_folder ?? "",
            steamId: game.game_steam_id ?? "",
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default UpdateDialog;
