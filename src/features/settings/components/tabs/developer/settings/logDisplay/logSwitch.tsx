import { memo } from "react";
import type { LogEntry } from "@/@types/logs";
import {
	ConsoleDebugDisplay,
	ConsoleErrorDisplay,
	ConsoleInfoDisplay,
	ConsoleTraceDisplay,
	ConsoleWarningDisplay,
} from "./logTypes";

const LogSwitch = memo(({ message, timestamp, level }: LogEntry) => {
	switch (level) {
		case "error":
			return (
				<ConsoleErrorDisplay
					key={timestamp}
					description={message}
					timestamp={timestamp}
				/>
			);
		case "warn":
			return (
				<ConsoleWarningDisplay
					key={timestamp}
					description={message}
					timestamp={timestamp}
				/>
			);
		case "info":
			return (
				<ConsoleInfoDisplay
					key={timestamp}
					description={message}
					timestamp={timestamp}
				/>
			);
		case "debug":
			return (
				<ConsoleDebugDisplay
					key={timestamp}
					description={message}
					timestamp={timestamp}
				/>
			);
		case "trace":
			return (
				<ConsoleTraceDisplay
					key={timestamp}
					description={message}
					timestamp={timestamp}
				/>
			);
		default:
			return (
				<ConsoleInfoDisplay
					key={timestamp}
					description={message}
					timestamp={timestamp}
				/>
			);
	}
});

LogSwitch.displayName = "LogSwitch";

export default LogSwitch;
