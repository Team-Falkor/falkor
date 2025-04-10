import { H5, TypographyMuted } from "@/components/ui/typography";

interface Props {
  title: string;
  text: string;
}

const DownloadCardStat = ({ text, title }: Props) => {
  return (
    <div className="flex flex-col gap-0.5">
      <H5 className="font-bold text-foreground">{text}</H5>
      <TypographyMuted className="font-semibold ">{title}</TypographyMuted>
    </div>
  );
};

export default DownloadCardStat;
