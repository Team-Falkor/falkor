import { useLanguageContext } from "@/contexts/I18N";
import { IGDBReturnDataType } from "@/lib/api/igdb/types";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import IGDBImage from "../IGDBImage";
import TrailerButton from "../trailer";
import { H2 } from "../typography/h2";
import { TypographySmall } from "../typography/small";
import { buttonVariants } from "../ui/button";

const BannerCard = ({
  screenshots: ss,
  cover,
  name,
  summary,
  storyline,
  id,
  videos,
}: IGDBReturnDataType) => {
  const { t } = useLanguageContext();

  const start = 1;
  const howMany = 3;

  // Memoize the screenshots to extract only a certain range
  const screenshots = useMemo(() => {
    return ss?.filter(
      (_item, index) => index >= start && index < howMany + start
    );
  }, [ss, start, howMany]);

  return (
    <div className="relative w-full overflow-hidden rounded-lg rounded-t-none h-[28rem] group transition-all duration-300 ease-in-out">
      <div className="absolute inset-0 z-0 w-full h-full overflow-hidden">
        <div className="absolute w-full h-full z-1 bg-gradient-to-t from-background via-background/80 to-transparent opacity-90" />
        <IGDBImage
          imageSize="720p"
          imageId={cover.image_id}
          className="object-cover w-full h-full transform scale-100 group-hover:scale-105 transition-transform duration-700 ease-in-out"
          alt={name}
        />
      </div>

      <div className="relative z-10 flex flex-col justify-end w-full h-full gap-3 p-6">
        <H2 className="text-4xl font-bold tracking-tight">{name}</H2>
        <TypographySmall className="text-muted-foreground/90 max-w-[70%] line-clamp-2">
          {storyline ?? summary ?? "??"}
        </TypographySmall>
        <div className="flex flex-row justify-end">
          <div className="flex flex-row items-end justify-between w-full gap-6">
            <div className="flex flex-row justify-start gap-4 mt-4">
              {screenshots?.map((screenshot) => (
                <IGDBImage
                  imageSize="screenshot_med"
                  key={screenshot.id}
                  imageId={screenshot.image_id}
                  className="object-cover w-48 rounded-lg aspect-video lg:w-56 shadow-lg hover:scale-105 transition-transform duration-300 ease-in-out"
                  alt={name}
                />
              ))}
            </div>

            <div className="flex flex-row gap-4">
              <TrailerButton name={name} videos={videos} />
              <Link
                className={buttonVariants({  })}
                to="/info/$id"
                params={{ id: id.toString() }}
              >
                {t("more_info")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerCard;
