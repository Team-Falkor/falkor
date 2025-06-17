import { PlusIcon } from "lucide-react";
import type { HTMLAttributes } from "react";
import { Button } from "@/components/ui/button";
import { H5 } from "@/components/ui/typography";

export const NewListButton = ({
	className,
	onClick,
	disabled = false,
	...props
}: HTMLAttributes<HTMLButtonElement> & {
	disabled?: boolean;
}) => {
	return (
		<Button
			className="ml-1 gap-1.5 rounded-full"
			onClick={onClick}
			disabled={disabled}
			{...props}
		>
			<PlusIcon strokeWidth={4} />
			<H5>New List</H5>
		</Button>
	);
};
