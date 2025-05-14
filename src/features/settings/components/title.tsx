import type { HTMLAttributes } from "react";
import { H3 } from "@/components/ui/typography";
import { cn } from "@/lib";

interface SettingTitleProps extends HTMLAttributes<HTMLDivElement> {
	children: string;
}

const SettingTitle = ({ children, className, ...props }: SettingTitleProps) => {
	return (
		<div className={cn("p-7 pb-5", className)} {...props}>
			<H3>{children}</H3>
		</div>
	);
};

export default SettingTitle;
