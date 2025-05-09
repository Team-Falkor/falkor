import type { JSX } from "react";
import { P } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

interface SettingTabProps {
	title: string;
	icon: JSX.Element;
	isActive: boolean;
	onClick: () => void;
}

const SettingTab = ({ icon, title, isActive, onClick }: SettingTabProps) => {
	return (
		<button
			className={cn([
				"group flex w-full items-center gap-3 p-3.5 font-medium text-sm transition-all duration-200 hover:bg-muted/50 hover:opacity-80",
				{
					"border-purple-600 border-r-4 bg-purple-600/25": isActive,
					"text-secondary-foreground/50": !isActive,
				},
			])}
			aria-current="page"
			onClick={onClick}
		>
			{icon}
			<P className="truncate">{title}</P>
		</button>
	);
};

export default SettingTab;
