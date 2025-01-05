import { H3 } from "@/components/typography/h3";

interface TitleProps {
  text: string;
}

export const Title = ({ text }: TitleProps) => <H3>{text}</H3>;
