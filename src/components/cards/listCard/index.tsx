import { ListGame } from "@/@types";
import { Card, CardContent } from "@/components/ui/card";
import { H5 } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import ListCardImage from "./image";

type ListCardProps = ListGame;

const ListCard: React.FC<ListCardProps> = ({ game_id, title, image }) => {
  const imageId = image
    ? `https:${image.replace("t_thumb", "t_cover_big")}`
    : "";

  return (
    <Card
      className={cn(
        "group relative m-0 w-[200px] rounded-lg p-0 overflow-hidden flex flex-col",
        "transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
      )}
    >
      <CardContent className="p-0 m-0">
        <Link to={`/info/$id`} params={{ id: game_id.toString() }}>
          <div className="relative">
            <ListCardImage imageId={imageId} alt={title} />
          </div>

          {/* Card info section that's always visible */}
          <div className="p-2">
            <H5 className="text-center line-clamp-2 h-12 flex items-center justify-center">
              {title}
            </H5>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
};

export default ListCard;
