import { H2, TypographyMuted } from "@/components/ui/typography";
import type { ActiveLibraryProps } from "./active-library";

const LibraryHeader = (props: ActiveLibraryProps) => {
	return (
		<header className="flex flex-col items-start justify-center rounded-lg bg-muted/30 p-6">
			<H2>{props.title}</H2>
			{props.description && (
				<TypographyMuted className="mt-0.5 text-sm">
					{props.description}
				</TypographyMuted>
			)}
		</header>
	);
};

export default LibraryHeader;
