import { ListGame } from "@/@types";
import { H5 } from "@/components/ui/typography";
import { Link } from "@tanstack/react-router";
import ListCardImage from "./image";

type ListCardProps = ListGame;

const ListCard: React.FC<ListCardProps> = ({ game_id, title, image }) => {
  const imageId = image
    ? `https:${image.replace("t_thumb", "t_cover_big")}`
    : "";

  return (
    <Link to={`/info/$id`} params={{ id: game_id.toString() }}>
      <div className="w-[200px] h-[300px] relative flex flex-col rounded-lg overflow-hidden border transition-shadow duration-300 group hover:shadow-xl hover:border-border">
        {/* IMAGE */}
        <div className="absolute inset-0 z-0 overflow-hidden transition-transform duration-300 group-hover:scale-105">
          <ListCardImage imageId={imageId} alt={title} />

          <span className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
        </div>

        {/* CONTENT */}
        <div className="relative z-10 flex flex-col justify-between h-full p-3 px-4">
          <div />
          <H5 className="text-pretty transition-all duration-300 transform group-hover:-translate-y-1 group-hover:opacity-100 line-clamp-2">
            {title}
          </H5>
        </div>
      </div>
    </Link>
  );
};

export default ListCard;
