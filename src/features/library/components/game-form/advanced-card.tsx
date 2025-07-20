import type { ChangeEvent } from "react";
import type { Game } from "@/@types";
import { InputWithIcon } from "@/components/inputWithIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useLanguageContext } from "@/i18n/I18N";

interface AdvancedCardProps {
	game: Partial<Game>;
	onGameChange: (updatedFields: Partial<Game>) => void;
}

export const AdvancedCard = ({ game, onGameChange }: AdvancedCardProps) => {
	const { t } = useLanguageContext();
	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		onGameChange({ [name]: value } as Partial<Game>);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("game_form.advanced.title")}</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid w-full items-center gap-2">
					<Label htmlFor="winePrefixFolder">{t("game_form.advanced.wine_prefix")}</Label>
					<InputWithIcon
						id="winePrefixFolder"
						name="winePrefixFolder"
						value={game.winePrefixFolder || ""}
						onChange={handleChange}
						placeholder={t("game_form.advanced.wine_prefix_placeholder")}
					/>
				</div>
			</CardContent>
		</Card>
	);
};