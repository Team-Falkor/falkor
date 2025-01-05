import { LogEntry } from "@/@types/logs";
import { Info } from "lucide-react";
import { JSX } from "react";
import { BaseLog } from "./base";
import { TypographyMuted } from "@/components/typography/muted";

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
