import type { Game } from "@/@types";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useLanguageContext } from "@/i18n/I18N";
import { trpc } from "@/lib";

interface FavoriteGameProps {
	game: Game;
}

export const FavoriteGame = ({ game }: FavoriteGameProps) => {
	const { t } = useLanguageContext();
	const utils = trpc.useUtils();

	const { mutate: favoriteGameMutation, isPending } =
		trpc.library.favoriteGame.useMutation({
			async onSuccess() {
				await utils.library.invalidate(undefined, {
					refetchType: "all",
					type: "all",
				});
			},
		});

	const handleFavoriteGame = async () => {
		favoriteGameMutation({
			id: game.id,
		});
	};

	return (
		<DropdownMenuItem
			onSelect={(e) => {
				e.preventDefault();
				handleFavoriteGame();
			}}
			disabled={isPending}
		>
			{game.isFavorite ? t("unfavorite") : t("favorite")}
		</DropdownMenuItem>
	);
};
