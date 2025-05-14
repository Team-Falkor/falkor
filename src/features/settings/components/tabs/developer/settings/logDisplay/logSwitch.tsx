import type { LogEntry } from "@/@types/logs";
import {
	ConsoleErrorDisplay,
	ConsoleInfoDisplay,
	ConsoleWarningDisplay,
} from "./logTypes";

const LogSwitch = ({ message, timestamp, level }: LogEntry) => {
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

		default:
			return (
				<ConsoleErrorDisplay
					key={timestamp}
					description={message}
					timestamp={timestamp}
				/>
			);
	}
};

export default LogSwitch;
