import type { InfoItadProps, InfoProps, RouterOutputs } from "@/@types";
import type { GameDateResult } from "@/lib";
import PcSpecs from "../specs";
import InfoAboutTab from "./about";

type SelectedTab0Data = InfoItadProps &
	InfoProps & {
		data: RouterOutputs["igdb"]["info"];
		isReleased: boolean;
		releaseDate: GameDateResult | null | undefined;
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
