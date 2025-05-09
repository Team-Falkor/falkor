import { PlusIcon } from "lucide-react";
import type { HTMLAttributes } from "react";
import { Button } from "@/components/ui/button";
import { H5 } from "@/components/ui/typography";

export const NewListButton = ({
	className,
	onClick,
	...props
}: HTMLAttributes<HTMLButtonElement>) => {
	return (
		<Button className="ml-1 gap-1.5 rounded-full" onClick={onClick} {...props}>
			<PlusIcon strokeWidth={3} />
			<H5>New List</H5>
		</Button>
	);
};
