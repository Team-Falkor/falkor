import { Link } from "@tanstack/react-router";
import { Gamepad2 } from "lucide-react";
import type { IGDBReturnDataType } from "@/@types";
import IGDBImage from "@/components/IGDBImage";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { P, TypographyMuted } from "@/components/ui/typography";

const SearchCard = ({
	name,
	id,
	setOpen,
	release_dates,
	cover,
}: IGDBReturnDataType & {
	setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
	const year = release_dates?.[0]?.human;

	return (
		<Link
			className="group w-full cursor-default select-none rounded-lg p-2 transition-colors duration-200 hover:cursor-pointer hover:bg-accent/50"
			key={1}
			to={"/info/$id"}
			params={{ id: id.toString() }}
			onClick={() => setOpen(false)}
		>
			<div className="flex items-center gap-3">
				{cover?.image_id ? (
					<IGDBImage
						alt={name}
						imageId={cover.image_id}
						className="size-12 rounded-md object-cover shadow-sm transition-transform duration-200 group-hover:scale-105"
					/>
				) : (
					<Avatar className="size-12 transition-transform duration-200 group-hover:scale-105">
						<AvatarFallback className="bg-muted/50">
							<Gamepad2 className="size-6" />
						</AvatarFallback>
					</Avatar>
				)}
				<div className="flex flex-1 flex-col gap-0.5">
					<P className="line-clamp-1 font-medium text-muted-foreground text-sm group-hover:text-foreground">
						{name}
					</P>
					<TypographyMuted className="text-xs">{year}</TypographyMuted>
				</div>
			</div>
		</Link>
	);
};

export default SearchCard;
