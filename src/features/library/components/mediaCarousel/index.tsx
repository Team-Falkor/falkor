import { useState } from "react";
import { MainMediaDisplay } from "./mainMediaDisplay";
import { ThumbnailCarousel } from "./thumbnailCarousel";
import { Thumbnail } from "./types";

interface MediaCarouselProps {
  mainMedia: Thumbnail;
  thumbnails: Array<Thumbnail> | undefined;
}

export const MediaCarousel = ({
  mainMedia,
  thumbnails,
}: MediaCarouselProps) => {
  const [selectedMedia, setSelectedMedia] = useState<Thumbnail>(mainMedia);

  return (
    <div className="flex flex-col gap-3">
      {/* Main Media Display */}
      <MainMediaDisplay media={selectedMedia} />

      {/* Thumbnail Carousel */}
      <ThumbnailCarousel
        thumbnails={thumbnails}
        onThumbnailClick={(media) => setSelectedMedia(media)}
      />
    </div>
  );
};
