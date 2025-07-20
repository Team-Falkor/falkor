import { FolderOpen } from "lucide-react";
import type { ChangeEvent } from "react";
import type { Game } from "@/@types";
import { InputWithIcon } from "@/components/inputWithIcon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLanguageContext } from "@/i18n/I18N";

interface LaunchConfigurationCardProps {
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

export const LaunchConfigurationCard = ({
	game,
	onGameChange,
	onFileBrowse,
}: LaunchConfigurationCardProps) => {
	const { t } = useLanguageContext();
	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		onGameChange({ [name]: value } as Partial<Game>);
	};

	const handleRunAsAdminToggle = (checked: boolean) => {
		onGameChange({ runAsAdmin: checked });
	};

	const handleGamePathSelect = () =>
		onFileBrowse(
			{
				properties: ["openFile"],
				filters: [
					{
						name: "Executable",
						extensions: [
							"exe",
							"bat",
							"cmd",
							"sh",
							"run",
							"AppImage",
							"jar",
							"url",
						],
					},
				],
			},
			"gamePath",
		);

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("game_form.launch_configuration.title")}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid w-full items-center gap-2">
					<Label htmlFor="gamePath">
						{t("game_form.launch_configuration.game_path")}
					</Label>
					<InputWithIcon
						id="gamePath"
						name="gamePath"
						value={game.gamePath || ""}
						onChange={handleChange}
						placeholder={t(
							"game_form.launch_configuration.game_path_placeholder",
						)}
						endIcon={
							<Button
								type="button"
								onClick={handleGamePathSelect}
								aria-label={t(
									"game_form.launch_configuration.browse_for_game_path",
								)}
								className="cursor-pointer transition-all focus-states:scale-105 focus-states:opacity-70"
							>
								<FolderOpen />
							</Button>
						}
					/>
				</div>
				<div className="grid w-full items-center gap-2">
					<Label htmlFor="gameArgs">
						{t("game_form.launch_configuration.launch_arguments")}
					</Label>
					<InputWithIcon
						id="gameArgs"
						name="gameArgs"
						value={game.gameArgs || ""}
						onChange={handleChange}
						placeholder={t(
							"game_form.launch_configuration.launch_arguments_placeholder",
						)}
					/>
				</div>

				<div className="flex items-center space-x-2 pt-2">
					<Switch
						id="runAsAdmin"
						checked={game.runAsAdmin ?? false}
						onCheckedChange={handleRunAsAdminToggle}
					/>
					<Label htmlFor="runAsAdmin">
						{t("game_form.launch_configuration.run_as_admin")}
					</Label>
				</div>
			</CardContent>
		</Card>
	);
};
