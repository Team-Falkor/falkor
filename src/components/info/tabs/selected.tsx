import { InfoItadProps, InfoProps } from "@/@types";
import { InfoReturn, ReleaseDate } from "@/lib/api/igdb/types";
import PcSpecs from "../specs";
import InfoAboutTab from "./about";

type SelectedTab0Data = InfoItadProps &
  InfoProps & {
    data: InfoReturn | undefined;
    isReleased: boolean;
    releaseDate: ReleaseDate | null | undefined;
  };

type Props = SelectedTab0Data & {
  selectedTab: number;
};

const SelectedInfoTab = ({ selectedTab, ...data }: Props) => {
  if (selectedTab === 0) {
    return <InfoAboutTab {...data} />;
  }

  if (selectedTab === 1) {
    return <PcSpecs {...data?.data?.steam?.data?.pc_requirements} />;
  }

  return null;
};

export default SelectedInfoTab;
