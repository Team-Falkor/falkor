import type { Game } from "@/@types";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useLanguageContext } from "@/i18n/I18N";
import { trpc } from "@/lib";

interface HideGameProps {
	game: Game;
}

export const HideGame = ({ game }: HideGameProps) => {
	const { t } = useLanguageContext();
	const utils = trpc.useUtils();

	const { mutate: hideGameMutation, isPending } =
		trpc.library.hideGame.useMutation({
			async onSuccess() {
				await utils.library.invalidate(undefined, {
					refetchType: "all",
					type: "all",
				});
			},
		});

	const handleHideGame = async () => {
		hideGameMutation({
			id: game.id,
		});
	};

	return (
		<DropdownMenuItem
			onSelect={(e) => {
				e.preventDefault();
				handleHideGame();
			}}
			disabled={isPending}
		>
			{game.isHidden ? t("show") : t("hide")}
		</DropdownMenuItem>
	);
};
