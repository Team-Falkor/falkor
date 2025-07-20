import type { ChangeEvent } from "react";
import type { Game } from "@/@types";
import { InputWithIcon } from "@/components/inputWithIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useLanguageContext } from "@/i18n/I18N";

interface DatabaseIdsCardProps {
	game: Partial<Game>;
	onGameChange: (updatedFields: Partial<Game>) => void;
}

export const DatabaseIdsCard = ({ game, onGameChange }: DatabaseIdsCardProps) => {
	const { t } = useLanguageContext();
	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		onGameChange({ [name]: value } as Partial<Game>);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("game_form.database_ids.title")}</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div className="grid w-full items-center gap-2">
						<Label htmlFor="igdbId">{t("game_form.database_ids.igdb_id")}</Label>
						<InputWithIcon
							id="igdbId"
							name="igdbId"
							value={game.igdbId || ""}
							onChange={handleChange}
							placeholder={t("game_form.database_ids.igdb_id_placeholder")}
						/>
					</div>
					<div className="grid w-full items-center gap-2">
						<Label htmlFor="steamId">{t("game_form.database_ids.steam_id")}</Label>
						<InputWithIcon
							id="steamId"
							name="steamId"
							value={game.gameSteamId || ""}
							onChange={handleChange}
							placeholder={t("game_form.database_ids.steam_id_placeholder")}
						/>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};