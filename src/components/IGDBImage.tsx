import type { ImgHTMLAttributes } from "react";
import type { IGDBImageSize } from "@/@types";

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
	const src = imageId?.startsWith("http")
		? imageId
		: `https://images.igdb.com/igdb/image/upload/t_${imageSize}/${imageId}.png`;

	return <img src={src} alt={alt} {...props} aria-label={alt} />;
};

export default IGDBImage;
