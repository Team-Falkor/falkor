import type { ElementType, ReactNode } from "react";

import { TypographySmall } from "../../ui/typography";

interface StatPillProps {
	icon: ElementType;
	value: ReactNode;
	isVisible?: boolean;
}

const StatPill = ({ icon: Icon, value, isVisible = true }: StatPillProps) => {
	if (!isVisible) {
		return null;
	}

	return (
		<div className="flex items-center gap-2 rounded-full bg-card/80 px-2 py-1 shadow-sm backdrop-blur-sm">
			<Icon className="size-3" />
			<TypographySmall className="flex-1 text-xs">{value}</TypographySmall>
		</div>
	);
};

export default StatPill;
