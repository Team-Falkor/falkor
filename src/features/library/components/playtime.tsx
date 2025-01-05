import { P } from "@/components/typography/p";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import ms from "ms";

interface PlaytimeProps {
  playtime: number;
}

const Playtime = ({ playtime }: PlaytimeProps) => {
  if (!playtime) return <div></div>;

  return (
    <Badge className="flex items-center gap-1.5 px-2.5 py-1.5 h-full rounded-lg text-foreground backdrop-blur-md">
      <Clock size={16} className="text-foreground" />
      <P className="uppercase">
        {ms(playtime, {
          long: true,
        })}
      </P>
    </Badge>
  );
};

export default Playtime;
