import { IGDBReturnDataType, SimilarGame } from "@/lib/api/igdb/types";
import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import IGDBImage from "../IGDBImage";
import { Badge } from "../ui/badge";
import { H5 } from "../ui/typography";

type DefaultCardProps = (IGDBReturnDataType | SimilarGame) & {
  wantCountdown?: boolean;
  playtime?: number;
};

const DefaultCard = ({
  cover,
  name,
  id,
  total_rating,
  aggregated_rating,
}: DefaultCardProps) => {
  // Format rating to show only one decimal place if available
  const rating = total_rating ?? aggregated_rating ?? null;
  const formattedRating = rating ? Math.round(rating) / 10 : null;

  return (
    <Link to={`/info/$id`} params={{ id: id.toString() }}>
      <div className="w-[200px] relative h-[325px] flex flex-col rounded-lg overflow-hidden bg-card group hover:border-border">
        {formattedRating && (
          <Badge className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/80 backdrop-blur-sm px-2.5 py-1 text-sm shadow-lg z-10">
            <Star size={14} className="fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{formattedRating}</span>
          </Badge>
        )}

        {/* IMAGE */}
        <div className="w-full h-[260px] shrink-0 grow-0 group-hover:scale-[1.02] relative z-0 transition-all overflow-hidden">
          <IGDBImage
            alt={name}
            imageId={cover?.image_id}
            className="w-full h-full object-cover"
          />
        </div>

        {/* CONTENT */}
        <div className="size-full p-2 px-3 flex flex-col">
          <H5 className="text-pretty line-clamp-2">{name}</H5>
        </div>
      </div>
    </Link>
  );
};

export default DefaultCard;
