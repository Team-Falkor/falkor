import type { ChangeEvent } from "react";
import type { Game } from "@/@types";
import { InputWithIcon } from "@/components/inputWithIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useLanguageContext } from "@/i18n/I18N";

interface AdvancedCardProps {
	game: Partial<Game>;
	onGameChange: (updatedFields: Partial<Game>) => void;
	isProtonSupported?: boolean;
}

export const AdvancedCard = ({
	game,
	onGameChange,
	isProtonSupported,
}: AdvancedCardProps) => {
	const { t } = useLanguageContext();
	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		onGameChange({ [name]: value } as Partial<Game>);
	};

	// Put this here as no other options beside a linux specific option so do not render the card if proton is not supported
	if (isProtonSupported === false) return null;

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("game_form.advanced.title")}</CardTitle>
			</CardHeader>
			<CardContent>
				{isProtonSupported === true ? (
					<div className="grid w-full items-center gap-2">
						<Label htmlFor="winePrefixFolder">
							{t("game_form.advanced.wine_prefix")}
						</Label>
						<InputWithIcon
							id="winePrefixFolder"
							name="winePrefixFolder"
							value={game.winePrefixFolder || ""}
							onChange={handleChange}
							placeholder={t("game_form.advanced.wine_prefix_placeholder")}
						/>
					</div>
				) : null}
			</CardContent>
		</Card>
	);
};
