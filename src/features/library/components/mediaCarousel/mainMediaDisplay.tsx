import IGDBImage from "@/components/IGDBImage";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Thumbnail } from "./types";

interface MainMediaDisplayProps {
  media: Thumbnail;
}

export const MainMediaDisplay = ({ media }: MainMediaDisplayProps) => (
  <div className="relative">
    <AspectRatio ratio={16 / 9} className="w-full overflow-hidden rounded-lg">
      <IGDBImage
        imageId={media.media.image_id}
        alt={media.alt}
        className="object-cover w-full h-full"
      />
    </AspectRatio>
  </div>
);
