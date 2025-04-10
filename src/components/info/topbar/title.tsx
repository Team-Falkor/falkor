import { H3 } from "@/components/ui/typography";

interface TitleProps {
  text: string;
}

export const Title = ({ text }: TitleProps) => <H3>{text}</H3>;
