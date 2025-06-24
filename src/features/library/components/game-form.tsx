import { FolderOpen } from "lucide-react";
import type { ChangeEvent } from "react";
import type { Game } from "@/@types";
import { InputWithIcon } from "@/components/inputWithIcon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface GameFormProps {
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

export const GameForm = ({
	game,
	onGameChange,
	onFileBrowse,
}: GameFormProps) => {
	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		onGameChange({ [name]: value } as Partial<Game>);
	};

	const handleRunAsAdminToggle = (checked: boolean) => {
		onGameChange({ runAsAdmin: checked });
	};

	const getInitials = (name?: string) => {
		if (!name) return "GA";
		return name
			.split(" ")
			.map((n) => n[0])
			.slice(0, 2)
			.join("")
			.toUpperCase();
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
		<div className="flex-1 space-y-6 overflow-y-auto py-6 pr-4">
			<Card>
				<CardHeader>
					<CardTitle>Game Details</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
						<Avatar className="h-24 w-24 flex-shrink-0 rounded-lg sm:h-32 sm:w-32">
							<AvatarImage
								src={game.gameIcon ?? undefined}
								alt={game.gameName}
							/>
							<AvatarFallback className="rounded-lg text-3xl">
								{getInitials(game.gameName)}
							</AvatarFallback>
						</Avatar>
						<div className="w-full space-y-4 text-center sm:text-left">
							<div className="grid w-full items-center gap-2">
								<Label htmlFor="gameName">Game Name</Label>
								<InputWithIcon
									id="gameName"
									name="gameName"
									value={game.gameName || ""}
									onChange={handleChange}
									placeholder="e.g., Cyberpunk 2077"
								/>
							</div>
							<div className="grid w-full items-center gap-2">
								<Label htmlFor="gameIcon">Game Icon URL or Path</Label>
								<InputWithIcon
									id="gameIcon"
									name="gameIcon"
									value={game.gameIcon || ""}
									onChange={handleChange}
									placeholder="https://url.to/icon.png or /path/to/icon.ico"
									endIcon={
										<Button
											type="button"
											onClick={handleGameIconSelect}
											aria-label="Browse for Icon"
											className="cursor-pointer"
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

			<Card>
				<CardHeader>
					<CardTitle>Launch Configuration</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid w-full items-center gap-2">
						<Label htmlFor="gamePath">Game Path</Label>
						<InputWithIcon
							id="gamePath"
							name="gamePath"
							value={game.gamePath || ""}
							onChange={handleChange}
							placeholder="e.g., /path/to/game.exe"
							endIcon={
								<Button
									type="button"
									onClick={handleGamePathSelect}
									aria-label="Browse for Game Path"
									className="cursor-pointer"
								>
									<FolderOpen />
								</Button>
							}
						/>
					</div>
					<div className="grid w-full items-center gap-2">
						<Label htmlFor="gameArgs">Launch Arguments</Label>
						<InputWithIcon
							id="gameArgs"
							name="gameArgs"
							value={game.gameArgs || ""}
							onChange={handleChange}
							placeholder="e.g., -nolauncher --skip-intro"
						/>
					</div>

					<div className="flex items-center space-x-2 pt-2">
						<Switch
							id="runAsAdmin"
							checked={game.runAsAdmin ?? false}
							onCheckedChange={handleRunAsAdminToggle}
						/>
						<Label htmlFor="runAsAdmin">Run as Administrator</Label>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Database IDs</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="grid w-full items-center gap-2">
							<Label htmlFor="igdbId">IGDB ID</Label>
							<InputWithIcon
								id="igdbId"
								name="igdbId"
								value={game.igdbId || ""}
								onChange={handleChange}
								placeholder="e.g., 11169"
							/>
						</div>
						<div className="grid w-full items-center gap-2">
							<Label htmlFor="steamId">Steam ID</Label>
							<InputWithIcon
								id="steamId"
								name="steamId"
								value={game.gameSteamId || ""}
								onChange={handleChange}
								placeholder="e.g., 1091500"
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Advanced (Optional)</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid w-full items-center gap-2">
						<Label htmlFor="winePrefixFolder">WINE Prefix</Label>
						<InputWithIcon
							id="winePrefixFolder"
							name="winePrefixFolder"
							value={game.winePrefixFolder || ""}
							onChange={handleChange}
							placeholder="e.g., ~/.wine-game"
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};
