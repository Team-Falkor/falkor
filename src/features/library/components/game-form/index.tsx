import type { Game } from "@/@types";
import { AdvancedCard } from "./advanced-card";
import { DatabaseIdsCard } from "./database-ids-card";
import { GameDetailsCard } from "./game-details-card";
import { LaunchConfigurationCard } from "./launch-configuration-card";
import { ProtonConfigurationCard } from "./proton-configuration-card";

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
	return (
		<div className="flex-1 space-y-6 overflow-y-auto py-6 pr-4">
			<GameDetailsCard
				game={game}
				onGameChange={onGameChange}
				onFileBrowse={onFileBrowse}
			/>

			<LaunchConfigurationCard
				game={game}
				onGameChange={onGameChange}
				onFileBrowse={onFileBrowse}
			/>

			<DatabaseIdsCard game={game} onGameChange={onGameChange} />

			<AdvancedCard game={game} onGameChange={onGameChange} />

			<ProtonConfigurationCard game={game} onGameChange={onGameChange} />
		</div>
	);
};
