import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface GameAvatarProps {
	gameIcon?: string | null;
	gameName?: string;
}

export const GameAvatar = ({ gameIcon, gameName }: GameAvatarProps) => {
	const getInitials = (name?: string) => {
		if (!name) return "GA";
		return name
			.split(" ")
			.map((n) => n[0])
			.slice(0, 2)
			.join("")
			.toUpperCase();
	};

	return (
		<Avatar className="h-24 w-24 flex-shrink-0 rounded-lg sm:h-32 sm:w-32">
			<AvatarImage
				src={gameIcon ?? undefined}
				alt={gameName}
			/>
			<AvatarFallback className="rounded-lg text-3xl">
				{getInitials(gameName)}
			</AvatarFallback>
		</Avatar>
	);
};