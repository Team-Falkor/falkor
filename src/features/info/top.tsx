import { useState } from "react";
import type {
	InfoItadProps,
	InfoProps,
	ReleaseDate,
	RouterOutputs,
} from "@/@types";
import IGDBImage from "@/components/IGDBImage";
import ProtonDbBadge from "@/components/protonDbBadge";
import InfoTopSkeleton from "@/components/skeletons/info/top.skeleton";
import { Button } from "@/components/ui/button";
import SelectedInfoTab from "./tabs/selected";

type InfoTopProps = InfoProps & {
	data: RouterOutputs["igdb"]["info"];
	isReleased: boolean;
	releaseDate: ReleaseDate | null | undefined;
	steamID: string | null | undefined;
	// playingData: LibraryGame | null | undefined;
	// playingPending: boolean;
};

type Props = InfoTopProps & InfoItadProps;

const InfoTop = (props: Props) => {
	const { data, isPending, error, steamID } = props;
	const [activeTab, setActiveTab] = useState<number>(0);

	if (error) return null;

	if (isPending) return <InfoTopSkeleton />;

	return (
		<div className="flex h-[32rem] overflow-hidden">
			{/* BACKGROUND */}
			<div className="absolute inset-0 z-0 h-[38rem] w-full overflow-hidden bg-center bg-cover bg-no-repeat drop-shadow-xl">
				<IGDBImage
					imageId={
						data?.screenshots?.[0]?.image_id ?? data?.cover?.image_id ?? ""
					}
					alt={data?.name ?? ""}
					className="relative z-0 h-full w-full overflow-hidden object-cover blur-md"
					imageSize="screenshot_med"
					loading="eager"
				/>

				<span className="absolute inset-0 bg-linear-to-t from-background to-transparent" />
			</div>

			<div className="relative z-10 mb-5 flex w-full items-start justify-between gap-6">
				{/* LEFT */}
				<div className="relative h-full overflow-hidden rounded-2xl xl:w-[35%]">
					<div className="absolute inset-0 z-0 h-full w-full overflow-hidden">
						<div className="flex h-full w-full flex-col justify-between">
							{/* ProtonDB badge */}
							<div className="flex size-full items-start justify-end pt-5">
								<div className="overflow-hidden rounded-l-lg">
									{steamID ? <ProtonDbBadge appId={steamID} /> : null}
								</div>
							</div>
						</div>
					</div>

					<IGDBImage
						imageId={data?.cover?.image_id ?? ""}
						alt={data?.name ?? ""}
						className="h-full w-full overflow-hidden object-cover object-top"
						loading="lazy"
					/>
				</div>

				{/* INFO SECTION (RIGHT) */}
				<div className="flex h-full flex-1 flex-col justify-start gap-5 overflow-hidden">
					{/* TAB SELECTOR */}
					<div className="flex gap-4">
						<Button
							onClick={() => setActiveTab(0)}
							variant={activeTab === 0 ? "active" : "default"}
						>
							Game Details
						</Button>
						<Button
							onClick={() => setActiveTab(1)}
							variant={activeTab === 1 ? "active" : "default"}
						>
							System Requirements
						</Button>
					</div>
					<SelectedInfoTab selectedTab={activeTab} {...props} />
				</div>
			</div>
		</div>
	);
};

export default InfoTop;
