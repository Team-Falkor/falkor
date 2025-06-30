import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib";
import { TypographySmall } from "../../ui/typography";

interface StatPillProps {
	icon: ElementType;
	value: ReactNode;
	isVisible?: boolean;
	iconClassName?: string;
}

const StatPill = ({
	icon: Icon,
	value,
	isVisible = true,
	iconClassName,
}: StatPillProps) => {
	if (!isVisible) {
		return null;
	}

	return (
		<div className="flex items-center gap-2 rounded-full bg-muted px-2 py-1 shadow-sm">
			<Icon className={cn("size-3", iconClassName)} />
			<TypographySmall className="flex-1 text-xs">{value}</TypographySmall>
		</div>
	);
};

export default StatPill;
