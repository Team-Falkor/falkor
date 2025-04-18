import { Badge } from "@/components/ui/badge";
import { P } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import ms from "ms";

interface PlaytimeProps {
  playtime: number;
  className?: string;
}

const Playtime = ({ playtime, className }: PlaytimeProps) => {
  if (!playtime) return <div></div>;

  return (
    <Badge
      className={cn(
        "flex items-center gap-1 px-2 py-0.5 h-auto rounded-md text-foreground backdrop-blur-md",
        className
      )}
    >
      <Clock size={12} className="text-foreground" />
      <P className="uppercase text-xs font-medium">
        {ms(playtime, {
          long: true,
        })}
      </P>
    </Badge>
  );
};

export default Playtime;
