import { CircleAlert } from "lucide-react";
import type { JSX } from "react";
import type { LogEntry } from "@/@types/logs";
import { TypographyMuted } from "@/components/ui/typography";
import { BaseLog } from "./base";

interface ConsoleWarningDisplayProps {
	customIcon?: JSX.Element;
	// title: string;
	description: string;
	timestamp?: LogEntry["timestamp"];
}

const ConsoleWarningDisplay = ({
	description,
	customIcon,
	timestamp,
}: ConsoleWarningDisplayProps) => {
	return (
		<BaseLog timestamp={timestamp}>
			<div className="text-yellow-400">
				{customIcon ? customIcon : <CircleAlert />}
			</div>
			<TypographyMuted>{description}</TypographyMuted>
		</BaseLog>
	);
};

export { ConsoleWarningDisplay };
