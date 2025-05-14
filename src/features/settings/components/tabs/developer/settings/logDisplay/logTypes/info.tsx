import { Info } from "lucide-react";
import type { JSX } from "react";
import type { LogEntry } from "@/@types/logs";
import { TypographyMuted } from "@/components/ui/typography";
import { BaseLog } from "./base";

interface ConsoleInfoDisplayProps {
	customIcon?: JSX.Element;
	// title: string;
	description: string;
	timestamp?: LogEntry["timestamp"];
}

const ConsoleInfoDisplay = ({
	description,
	customIcon,
	timestamp,
}: ConsoleInfoDisplayProps) => {
	return (
		<BaseLog timestamp={timestamp}>
			<div className="text-orange-400">
				{customIcon ? customIcon : <Info />}
			</div>
			<TypographyMuted>{description}</TypographyMuted>
		</BaseLog>
	);
};

export { ConsoleInfoDisplay };
