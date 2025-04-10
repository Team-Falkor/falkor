interface BackgroundImageProps {
  bgImage: string;
  className?: string;
}

const BackgroundImage: React.FC<BackgroundImageProps> = ({
  bgImage,
  className,
}) => {
  const isRemoteImage = /^https?:\/\//i.test(bgImage);
  const realImagePath = isRemoteImage ? bgImage : `local:${encodeURI(bgImage)}`;

  return (
    <div
      className={`${className} bg-cover bg-center bg-no-repeat`}
      style={{
        backgroundImage: `url(${realImagePath})`,
        backgroundPosition: "center",
        objectFit: "cover",
      }}
    />
  );
};

export default BackgroundImage;
