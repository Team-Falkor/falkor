import { H3 } from "@/components/typography/h3";
import { TypographyMuted } from "@/components/typography/muted";

interface Props {
  title: string;
  text: string;
}

const DownloadCardStat = ({ text, title }: Props) => {
  return (
    <div className="flex flex-col gap-0.5">
      <H3 className="font-bold text-foreground">{text}</H3>
      <TypographyMuted className="font-semibold uppercase">
        {title}
      </TypographyMuted>
    </div>
  );
};

export default DownloadCardStat;
