import type { IGDBReturnDataType } from "@/@types";
import DefaultCard from "../skeletons/defaultCard";
import { TypographyMuted } from "../ui/typography";

type GameGridProps = {
	data: IGDBReturnDataType[];
};

export const GameGrid = ({ data }: GameGridProps) => {
	if (!data || data.length === 0) {
		return (
			<div className="flex h-[calc(100vh-15rem)] items-center justify-center">
				<TypographyMuted>No games found for this category.</TypographyMuted>
			</div>
		);
	}

	return (
		<div
			className="grid gap-4 sm:gap-5"
			style={{
				gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
			}}
		>
			{data.map((game) => (
				<DefaultCard key={game.id} {...game} />
			))}
		</div>
	);
};
