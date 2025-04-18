import { IGDBReturnDataType } from "@/lib/api/igdb/types";
import TopbarSkeleton from "../skeletons/info/topbar.skeleton";
import { Topbar } from "./topbar";

interface InfoBarProps {
  onBack: () => void;
  titleText: string;
  data?: IGDBReturnDataType;
  isPending: boolean;
}

export const InfoBar = ({
  onBack,
  titleText,
  isPending,
  data,
}: InfoBarProps) => {
  if (isPending) return <TopbarSkeleton />;
  if (!data) return null;

  return (
    <div className="relative z-10 w-full">
      <Topbar onBack={onBack} titleText={titleText} data={data} />
    </div>
  );
};
