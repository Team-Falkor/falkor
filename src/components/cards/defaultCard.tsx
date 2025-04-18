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
      <div className="w-[200px] h-[300px] relative flex flex-col rounded-lg overflow-hidden border transition-shadow duration-300 group hover:shadow-xl hover:border-border">
        {/* IMAGE */}
        <div className="absolute inset-0 z-0 overflow-hidden transition-transform duration-300 group-hover:scale-105">
          <IGDBImage
            alt={name}
            imageId={cover?.image_id}
            className="w-full h-full object-cover"
          />

          <span className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
        </div>

        {/* CONTENT */}
        <div className="relative z-10 flex flex-col justify-between h-full p-3 px-4">
          <div className="flex w-full justify-end items-end">
            {formattedRating && (
              <Badge className="flex items-center gap-1.5 bg-black/80 backdrop-blur-sm px-2.5 py-1 text-sm shadow-lg">
                <Star size={14} className="fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{formattedRating}</span>
              </Badge>
            )}
          </div>

          <H5 className="text-pretty transition-all duration-300 transform group-hover:-translate-y-1 group-hover:opacity-100 line-clamp-2">
            {name}
          </H5>
        </div>
      </div>
    </Link>
  );
};

export default DefaultCard;
