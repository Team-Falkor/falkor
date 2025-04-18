import IGDBImage from "@/components/IGDBImage";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Thumbnail } from "./types";

interface ThumbnailCarouselProps {
  thumbnails: Thumbnail[] | undefined;
  onThumbnailClick: (media: Thumbnail) => void;
}

export const ThumbnailCarousel = ({
  thumbnails,
  onThumbnailClick,
}: ThumbnailCarouselProps) => {
  if (!thumbnails) return null;

  return (
    <Carousel>
      <CarouselContent className="-ml-2">
        {thumbnails.map((thumb, index) => (
          <CarouselItem key={index} className="pl-2 basis-auto">
            <div className="w-44">
              <AspectRatio
                ratio={16 / 9}
                className="overflow-hidden border-2 border-transparent rounded-lg cursor-pointer hover:border-primary"
                onClick={() => onThumbnailClick(thumb)}
              >
                <IGDBImage
                  imageId={thumb.media.image_id}
                  alt={thumb.alt}
                  className="object-cover w-full h-full"
                />
              </AspectRatio>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
};
