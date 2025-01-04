import { useLanguageContext } from "@/contexts/I18N";
import { cn } from "@/lib";
import { Link } from "@tanstack/react-router";
import { HTMLAttributes } from "react";
import CarouselButton from "../carouselButton";
import GenericRow from "../genericRow";
import { H3 } from "../typography/h3";
import { Carousel } from "../ui/carousel";

interface RowContainerProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  dataToFetch: "mostAnticipated" | "topRated" | "newReleases";
  id?: string; // Added optional id prop
}

const RowContainer = ({
  dataToFetch,
  title,
  className,
  id,
  ...props
}: RowContainerProps) => {
  const { t } = useLanguageContext();

  return (
    <div className={cn("mx-auto", className)} id={id} {...props}>
      <Carousel
        className={className}
        id={id}
        opts={{
          skipSnaps: true,
          dragFree: true,
        }}
      >
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-end gap-2">
            <H3>{title}</H3>

            <Link
              to={`/sections/${dataToFetch}`}
              className={cn("p-0 m-0 text-sm text-slate-400 hover:underline")}
            >
              {t("view_more")}
            </Link>
          </div>

          <div>
            <CarouselButton direction="left" id={`${dataToFetch}-left-btn`} />
            <CarouselButton direction="right" />
          </div>
        </div>

        <GenericRow dataToFetch={dataToFetch} fetchKey={[dataToFetch]} />
      </Carousel>
    </div>
  );
};

export default RowContainer;
