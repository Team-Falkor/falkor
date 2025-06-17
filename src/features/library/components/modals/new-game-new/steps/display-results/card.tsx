import { ImageIcon } from "lucide-react";
import type { IGDBReturnDataType } from "@/@types";
import IGDBImage from "@/components/IGDBImage";
import { cn } from "@/lib/utils";

interface GameResultCardProps {
	result: IGDBReturnDataType;
	isSelected: boolean;
	onClick: () => void;
}

export const GameResultCard = ({
	result,
	isSelected,
	onClick,
}: GameResultCardProps) => {
	const releaseYear = result.first_release_date
		? new Date(result.first_release_date * 1000).getFullYear()
		: "N/A";

	const summary =
		result?.summary?.substring(0, 120) +
			(result?.summary?.length > 120 ? "..." : "") || "No summary available.";

	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"flex w-full gap-4 rounded-lg border p-3 text-left transition-all duration-200 hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
				{ "border-primary bg-accent ring-2 ring-primary": isSelected },
			)}
		>
			<div className="relative h-32 w-24 flex-shrink-0">
				{result.cover ? (
					<IGDBImage
						imageId={result.cover.image_id}
						imageSize="cover_big"
						alt={`Cover for ${result.name}`}
						className="h-full w-full rounded-md object-cover"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center rounded-md bg-muted">
						<ImageIcon className="h-8 w-8 text-muted-foreground" />
					</div>
				)}
			</div>
			<div className="flex flex-col">
				<h3 className="font-bold">
					{result.name} <span className="font-normal">({releaseYear})</span>
				</h3>
				<p className="mt-2 text-sm">{summary}</p>
			</div>
		</button>
	);
};
