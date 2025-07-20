import { FolderOpen } from "lucide-react";
import type { ChangeEvent } from "react";
import type { Game } from "@/@types";
import { InputWithIcon } from "@/components/inputWithIcon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useLanguageContext } from "@/i18n/I18N";
import { GameAvatar } from "./game-avatar";

interface GameDetailsCardProps {
	game: Partial<Game>;
	onGameChange: (updatedFields: Partial<Game>) => void;
	onFileBrowse: (
		config: {
			properties: ("openFile" | "openDirectory")[];
			filters: { name: string; extensions: string[] }[];
		},
		updateKey: keyof Game,
	) => Promise<void>;
}

export const GameDetailsCard = ({
	game,
	onGameChange,
	onFileBrowse,
}: GameDetailsCardProps) => {
	const { t } = useLanguageContext();
	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		onGameChange({ [name]: value } as Partial<Game>);
	};

	const handleGameIconSelect = () =>
		onFileBrowse(
			{
				properties: ["openFile"],
				filters: [
					{ name: "Images", extensions: ["png", "jpg", "jpeg", "ico"] },
				],
			},
			"gameIcon",
		);

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("game_form.game_details.title")}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
					<GameAvatar gameIcon={game.gameIcon} gameName={game.gameName} />
					<div className="w-full space-y-4 text-center sm:text-left">
						<div className="grid w-full items-center gap-2">
							<Label htmlFor="gameName">
								{t("game_form.game_details.game_name")}
							</Label>
							<InputWithIcon
								id="gameName"
								name="gameName"
								value={game.gameName || ""}
								onChange={handleChange}
								placeholder={t("game_form.game_details.game_name_placeholder")}
							/>
						</div>
						<div className="grid w-full items-center gap-2">
							<Label htmlFor="gameIcon">
								{t("game_form.game_details.game_icon")}
							</Label>
							<InputWithIcon
								id="gameIcon"
								name="gameIcon"
								value={game.gameIcon || ""}
								onChange={handleChange}
								placeholder={t("game_form.game_details.game_icon_placeholder")}
								endIcon={
									<Button
										type="button"
										onClick={handleGameIconSelect}
										aria-label={t("game_form.game_details.browse_for_icon")}
										className="cursor-pointer transition-all focus-states:scale-105 focus-states:opacity-70"
									>
										<FolderOpen />
									</Button>
								}
							/>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};
