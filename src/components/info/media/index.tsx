import { useLanguageContext } from "@/contexts/I18N";
import { IGDBReturnDataType } from "@/lib/api/igdb/types";
import MediaScreenshots from "./screenshots";
import MediaTrailer from "./trailer";
import { H1 } from "@/components/typography/h1";

const GameMedia = (props: IGDBReturnDataType) => {
  const { t } = useLanguageContext();
  const { name, screenshots, videos } = props;

  return (
    <div>
      <H1 className="pb-4">{t("media")}</H1>

      <MediaTrailer videos={videos} />

      <MediaScreenshots screenshots={screenshots} name={name} />
    </div>
  );
};

export default GameMedia;
