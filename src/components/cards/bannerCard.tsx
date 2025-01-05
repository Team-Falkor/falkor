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
    <div className="relative w-full overflow-hidden rounded-lg h-80">
      <div className="absolute inset-0 z-0 w-full h-full overflow-hidden">
        <div className="absolute w-full h-full z-[1] from-background to-transparent bg-gradient-to-tr" />
        <IGDBImage
          imageSize="720p"
          imageId={cover.image_id}
          className="object-cover w-full h-full"
          alt={name}
        />
      </div>

      <div className="relative z-10 flex flex-col justify-end w-full h-full gap-1 p-4">
        <H2>{name}</H2>
        <TypographySmall className="text-muted-foreground">
          {storyline ?? summary ?? "??"}
        </TypographySmall>
        <div className="flex flex-row justify-end">
          <div className="flex flex-row items-end justify-between w-full">
            <div className="flex flex-row justify-start gap-3 mt-3">
              {screenshots?.map((screenshot) => (
                <IGDBImage
                  imageSize="screenshot_med"
                  key={screenshot.id}
                  imageId={screenshot.image_id}
                  className="object-cover w-48 rounded-md aspect-video lg:w-56"
                  alt={name}
                />
              ))}
            </div>

            <div className="flex flex-row gap-3">
              <TrailerButton name={name} videos={videos} />
              <Link
                className={buttonVariants()}
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
