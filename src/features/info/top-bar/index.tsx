import type { IGDBReturnDataType } from "@/@types";
import { H3 } from "@/components/ui/typography";
import { AddToListButton } from "./add-to-list-button";
import { BackButton } from "./back-button";

interface TopbarProps {
	data: IGDBReturnDataType;
	onBack: () => void;
	titleText: string;
}

export const Topbar = ({ onBack, titleText, data }: TopbarProps) => (
	<div className="flex items-center justify-between gap-2 bg-black/45 p-4 px-8 backdrop-blur-xl">
		<div className="flex flex-col items-start">
			<BackButton onClick={onBack} />
			<H3>{titleText}</H3>
		</div>
		<AddToListButton {...data} />
	</div>
);
