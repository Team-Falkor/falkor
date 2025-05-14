import type { IGDBReturnDataType } from "@/@types";
import TopbarSkeleton from "@/components/skeletons/info/topbar.skeleton";
import { Topbar } from "./top-bar";

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
