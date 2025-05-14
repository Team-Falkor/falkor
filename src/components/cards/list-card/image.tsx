import IGDBImage from "@/components/IGDBImage";

interface ListCardImageProps {
	imageId: string;
	alt: string;
}

const ListCardImage = ({ imageId, alt }: ListCardImageProps) => (
	<IGDBImage imageId={imageId} alt={alt} className="size-full object-cover " />
);

export default ListCardImage;
