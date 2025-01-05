import { LogEntry } from "@/@types/logs";
import { CircleAlert } from "lucide-react";
import { JSX } from "react";
import { BaseLog } from "./base";
import { TypographyMuted } from "@/components/typography/muted";

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
