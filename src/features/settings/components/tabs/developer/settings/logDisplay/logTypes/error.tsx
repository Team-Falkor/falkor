import { Ban } from "lucide-react";
import type { JSX } from "react";
import type { LogEntry } from "@/@types/logs";
import { TypographyMuted } from "@/components/ui/typography";
import { BaseLog } from "./base";

interface ConsoleErrorDisplayProps {
	customIcon?: JSX.Element;
	// title: string;
	description: string;
	timestamp?: LogEntry["timestamp"];
}

const ConsoleErrorDisplay = ({
	description,
	customIcon,
	timestamp,
}: ConsoleErrorDisplayProps) => {
	return (
		<BaseLog timestamp={timestamp}>
			<div className="text-red-400">{customIcon ? customIcon : <Ban />}</div>
			<TypographyMuted>{description}</TypographyMuted>
		</BaseLog>
	);
};

export { ConsoleErrorDisplay };
