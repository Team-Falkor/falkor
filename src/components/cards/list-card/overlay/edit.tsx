import type { RouterOutputs } from "@/@types";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useLanguageContext } from "@/i18n/I18N";
import { trpc } from "@/lib";
import UpdateGameForm from "./UpdateGameForm";

interface UpdateDialogProps {
	game: RouterOutputs["library"]["list"][number];
}

const UpdateDialog = ({ game }: UpdateDialogProps) => {
	const { t } = useLanguageContext();
	const utils = trpc.useUtils();
	const { mutate: updateGame } = trpc.library.update.useMutation({
		onSuccess: async () => {
			await utils.library.invalidate();
		},
	});

	return (
		<Dialog>
			<DialogTrigger asChild>
				<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
					{t("update")}
				</DropdownMenuItem>
			</DialogTrigger>
			<DialogContent className="flex h-[calc(100vh-10rem)] flex-col">
				<DialogHeader>
					<DialogTitle>{t("update_game")}</DialogTitle>
				</DialogHeader>

				<UpdateGameForm
					onSubmit={(values) => {
						updateGame({
							id: game.id,
							data: {
								gameArgs: values.gameArgs,
								gameCommand: values.gameCommand,
								gameName: values.gameName,
								gamePath: values.gamePath,
								gameIcon: values.gameIcon,
								igdbId: values.igdbId
									? Number.parseInt(values.igdbId)
									: undefined,
								winePrefixFolder: values.winePrefixFolder,
								gameSteamId: values.steamId,
								installed: values.installed,
							},
						});
						utils.library.list.invalidate();
						return;
					}}
					defaultValues={{
						gameArgs: game.gameArgs ?? undefined,
						gameCommand: game.gameCommand ?? undefined,
						gameName: game.gameName,
						gamePath: game.gamePath ?? undefined,
						gameIcon: game.gameIcon ?? undefined,
						igdbId: game.igdbId?.toString() ?? undefined,
						winePrefixFolder: game.winePrefixFolder ?? undefined,
						steamId: game.gameSteamId ?? undefined,
						gameId: game.gameId,
						installed: game.installed ?? undefined,
					}}
				/>
			</DialogContent>
		</Dialog>
	);
};

export default UpdateDialog;
