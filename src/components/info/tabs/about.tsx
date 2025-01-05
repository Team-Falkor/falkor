import { InfoItadProps, InfoProps } from "@/@types";
import Stars from "@/components/starts";
import { TypographyMuted } from "@/components/typography/muted";
import { TypographySmall } from "@/components/typography/small";
import { useLanguageContext } from "@/contexts/I18N";
import { IGDBReturnDataType, ReleaseDate } from "@/lib/api/igdb/types";
import { format } from "date-fns";
import { Lightbulb } from "lucide-react";
import { useMemo } from "react";
import Sources from "../sources";

interface InfoAboutTabProps extends InfoProps {
  data: IGDBReturnDataType | undefined;
  isReleased: boolean;
  releaseDate: ReleaseDate | null | undefined;
}

type Props = InfoAboutTabProps & InfoItadProps;

const InfoAboutTab = ({
  data,
  isReleased,
  releaseDate,
  isPending,
  itadData,
  itadError,
  itadPending,
}: Props) => {
  const { t } = useLanguageContext();

  const genres = useMemo(
    () =>
      data?.genres?.slice(0, 2)?.map((item) => ({
        ...item,
        name: item?.name?.split("(")?.[0]?.trim() ?? "",
      })) ?? [],
    [data?.genres]
  );

  const publisher = useMemo(
    () => data?.involved_companies?.find((item) => item.publisher),
    [data]
  );

  const developer = useMemo(
    () => data?.involved_companies?.find((item) => item.developer),
    [data]
  );

  const isSameDevAndPublisherSame =
    !!developer && !!publisher
      ? developer?.company?.name.toLowerCase() ===
        publisher?.company?.name?.toLowerCase()
      : false;

  return (
    <>
      <div className="flex flex-col flex-shrink-0 w-full gap-2 p-4 overflow-hidden h-52 rounded-2xl bg-background">
        <div className="flex items-center justify-between h-10 overflow-hidden">
          <TypographySmall className="flex items-center gap-2 p-2.5 rounded-full bg-secondary/20 font-semibold flex-shrink-0 flex-grow-0">
            <Lightbulb fill="currentColor" size={15} />
            {t("about_this_game")}
          </TypographySmall>

          <div className="flex items-center justify-end flex-1 gap-7">
            {!!isReleased && (data?.aggregated_rating ?? 0) > 0 && (
              <TypographySmall className="flex items-center gap-2 p-2.5 rounded-full bg-secondary/20 font-semibold">
                <Stars stars={(data?.aggregated_rating ?? 0) / 10} />
              </TypographySmall>
            )}

            <TypographySmall className="flex items-center gap-2 p-2.5 rounded-full bg-secondary/20 font-semibold">
              {!isReleased
                ? t("not_released")
                : !releaseDate?.date
                  ? "N/A"
                  : format(releaseDate.date * 1000, "MMM d, yyyy")}
            </TypographySmall>
          </div>
        </div>

        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {isSameDevAndPublisherSame ? (
              <TypographySmall
                key={publisher?.company?.id}
                className="flex items-center gap-2 p-2.5 rounded-full bg-secondary/20 font-semibold truncate"
              >
                {developer?.company?.name ?? "N/A"}
              </TypographySmall>
            ) : (
              <>
                <TypographySmall
                  key={publisher?.company?.id}
                  className="flex items-center gap-2 p-2.5 rounded-full bg-secondary/20 font-semibold truncate"
                >
                  {publisher?.company?.name ?? "N/A"}
                </TypographySmall>

                <TypographySmall
                  key={developer?.company?.id}
                  className="flex items-center gap-2 p-2.5 rounded-full bg-secondary/20 font-semibold truncate"
                >
                  {developer?.company?.name ?? "N/A"}
                </TypographySmall>
              </>
            )}
          </div>

          {!!genres && (
            <div className="flex items-center gap-1.5">
              {genres.map((genre) => (
                <TypographySmall
                  key={genre?.slug}
                  className="flex items-center gap-2 p-2.5 rounded-full bg-secondary/20 font-semibold truncate"
                >
                  {genre?.name}
                </TypographySmall>
              ))}
            </div>
          )}
        </div>

        <TypographyMuted className="-mt-1 text-pretty line-clamp-4">
          {data?.storyline ?? data?.summary ?? ""}
        </TypographyMuted>
      </div>

      {!!isReleased && !isPending && !!data && (
        <div className="">
          <Sources
            title={data?.name}
            isReleased={isReleased}
            websites={data?.websites}
            slug={data?.slug}
            itadData={itadData}
            itadError={itadError}
            itadPending={itadPending}
            game_data={{
              banner_id: data.screenshots?.[0].image_id,
              id: data.id,
              image_id: data.cover?.image_id,
              name: data.name,
            }}
          />
        </div>
      )}
    </>
  );
};

export default InfoAboutTab;
