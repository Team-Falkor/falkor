import IGDBImage from "@/components/IGDBImage";

interface ListCardImageProps {
  imageId: string;
  alt: string;
}

const ListCardImage: React.FC<ListCardImageProps> = ({ imageId, alt }) => (
  <div className="relative overflow-hidden rounded-t-lg group focus:outline-hidden dark:ring-offset-gray-900">
    <IGDBImage
      imageId={imageId}
      alt={alt}
      className="object-cover w-full transition duration-300 ease-out h-52 group-focus-within:scale-105 group-hover:scale-105 group-focus:scale-105"
    />
  </div>
);

export default ListCardImage;
