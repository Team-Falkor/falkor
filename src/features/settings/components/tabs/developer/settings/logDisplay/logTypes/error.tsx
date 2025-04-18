import { LogEntry } from "@/@types/logs";
import { Ban } from "lucide-react";
import { JSX } from "react";
import { BaseLog } from "./base";
import { TypographyMuted } from "@/components/ui/typography";

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
