import { IGDBReturnDataType, SimilarGame } from "@/lib/api/igdb/types";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { useMemo } from "react";
import IGDBImage from "../IGDBImage";
import { H5 } from "../typography/h5";
import { TypographyMuted } from "../typography/muted";
import { Card, CardContent } from "../ui/card";

type DefaultCardProps = (IGDBReturnDataType | SimilarGame) & {
  wantCountdown?: boolean;
};

const DefaultCard = ({
  cover,
  name,
  id,
  genres,
  release_dates,
}: DefaultCardProps) => {
  // Memoize the release date for a specific platform (e.g., platform ID 6 for PC)
  const findReleaseDate = useMemo(() => {
    return release_dates?.find((item) => item.platform === 6);
  }, [release_dates]);

  return (
    <Card className="group relative m-0 w-[200px] rounded-t-lg p-0 overflow-hidden">
      <CardContent className="p-0 m-0">
        <Link to={`/info/$id`} params={{ id: id.toString() }}>
          <div className="relative overflow-hidden rounded-t-lg group focus:outline-hidden dark:ring-offset-gray-900">
            <IGDBImage
              imageId={cover?.image_id ?? ""}
              imageSize="cover_med"
              alt={name}
              className="object-cover w-full transition duration-300 ease-out h-72 group-focus-within:scale-105 group-hover:scale-105 group-focus:scale-105"
            />
          </div>

          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center transition duration-300 ease-out translate-y-full rounded opacity-0 cursor-pointer bg-slate-700 bg-opacity-80 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100">
            <div className="flex flex-col items-center justify-center w-full gap-4 p-2">
              <div className="flex flex-col w-full gap-1">
                <H5 className="text-center text-white whitespace-pre-line break-before-avoid text-balance">
                  {name}
                </H5>

                {!!findReleaseDate && !!findReleaseDate?.date && (
                  <div className="flex items-center justify-center">
                    <TypographyMuted>
                      {format(
                        new Date(findReleaseDate?.date * 1000),
                        "MMMM d, yyyy"
                      )}
                    </TypographyMuted>
                  </div>
                )}

                <div className="flex items-center justify-center w-full gap-1 px-2 line-clamp-1 text-ellipsis">
                  {!!genres?.length &&
                    genres.slice(0, 2).map((genre, i) => (
                      <TypographyMuted
                        className="whitespace-nowrap line-clamp-1"
                        key={i}
                      >
                        {genre.name}
                        {i !== genres.slice(0, 2).length - 1 ? "," : ""}
                      </TypographyMuted>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
};

export default DefaultCard;
