import { IGDBImageSize } from "@/@types";
import { ImgHTMLAttributes } from "react";

interface IGDBImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  imageSize?: IGDBImageSize;
  imageId: string;
  alt: string;
}

const IGDBImage = ({
  imageSize = "original",
  imageId,
  alt,
  ...props
}: IGDBImageProps) => {
  const src = imageId.startsWith("http")
    ? imageId
    : `https://images.igdb.com/igdb/image/upload/t_${imageSize}/${imageId}.png`;

  return <img src={src} alt={alt} {...props} />;
};

export default IGDBImage;
