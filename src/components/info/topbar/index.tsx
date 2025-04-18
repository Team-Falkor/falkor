import { IGDBReturnDataType } from "@/lib/api/igdb/types";
import { AddToListButton } from "./addToListButton";
import { BackButton } from "./backButton";
import { Title } from "./title";

interface TopbarProps {
  data: IGDBReturnDataType;
  onBack: () => void;
  titleText: string;
}

export const Topbar = ({ onBack, titleText, data }: TopbarProps) => (
  <div className="flex items-center justify-between gap-2 p-4 px-8 bg-black/45 backdrop-blur-xl">
    <div className="flex flex-col items-start">
      <BackButton onClick={onBack} />
      <Title text={titleText} />
    </div>
    <AddToListButton {...data} />
  </div>
);
