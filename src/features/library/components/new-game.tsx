import { PlusIcon } from "lucide-react";
import type { HTMLAttributes } from "react";
import { Button } from "@/components/ui/button";
import { H5 } from "@/components/ui/typography";

interface Props extends HTMLAttributes<HTMLButtonElement> {
	disabled?: boolean;
	simpleStyle?: boolean;
}

export const NewGameButton = ({ onClick, disabled, ...props }: Props) => {
	return (
		<Button
			className="gap-1.5 rounded-full bg-linear-to-tr from-blue-400 to-purple-400 text-white transition-all focus-states:opacity-90"
			onClick={onClick}
			{...props}
			disabled={disabled}
		>
			<PlusIcon strokeWidth={4} />
			<H5>New Game</H5>
		</Button>
	);
};
