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
			type="button"
			className={cn(
				"group flex w-full items-center gap-3 p-4 font-medium text-sm transition-colors duration-200",
				"hover:bg-accent hover:text-accent-foreground",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
				isActive
					? "border-primary border-r-4 bg-primary/10 text-primary"
					: "text-muted-foreground",
			)}
			onClick={onClick}
		>
			{icon}
			<P className="truncate">{title}</P>
		</button>
	);
};

export default SettingTab;
