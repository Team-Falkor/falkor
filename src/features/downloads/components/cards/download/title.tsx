import { H4 } from "@/components/ui/typography";

interface Props {
  title: string;
}

const DownloadCardTitle = ({ title }: Props) => {
  return <H4 className="text-xl font-bold text-foreground">{title}</H4>;
};

export default DownloadCardTitle;
