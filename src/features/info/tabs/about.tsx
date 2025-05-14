import { format } from "date-fns";
import { Lightbulb } from "lucide-react";
import { useMemo } from "react";
import type {
	IGDBReturnDataType,
	InfoItadProps,
	InfoProps,
	ReleaseDate,
} from "@/@types";
import Stars from "@/components/starts";
import { TypographyMuted, TypographySmall } from "@/components/ui/typography";
import { useLanguageContext } from "@/i18n/I18N";
import Sources from "../sources";

interface InfoAboutTabProps extends InfoProps {
	data: IGDBReturnDataType | undefined;
	isReleased: boolean;
	releaseDate: ReleaseDate | null | undefined;
}

type Props = InfoAboutTabProps & InfoItadProps;

const InfoAboutTab = ({
	data,
	isReleased,
	releaseDate,
	isPending,
	itadData,
	itadError,
	itadPending,
}: Props) => {
	const { t } = useLanguageContext();

	const genres = useMemo(
		() =>
			data?.genres?.slice(0, 2)?.map((item) => ({
				...item,
				name: item?.name?.split("(")?.[0]?.trim() ?? "",
			})) ?? [],
		[data?.genres],
	);

	const publisher = useMemo(
		() => data?.involved_companies?.find((item) => item.publisher),
		[data],
	);

	const developer = useMemo(
		() => data?.involved_companies?.find((item) => item.developer),
		[data],
	);

	const isSameDevAndPublisherSame =
		!!developer && !!publisher
			? developer?.company?.name.toLowerCase() ===
				publisher?.company?.name?.toLowerCase()
			: false;

	return (
		<>
			<div className="flex h-52 w-full shrink-0 flex-col gap-2 overflow-hidden rounded-2xl bg-background p-4">
				<div className="flex h-10 items-center justify-between overflow-hidden">
					<TypographySmall className="flex shrink-0 grow-0 items-center gap-2 rounded-full bg-secondary/20 p-2.5 font-semibold">
						<Lightbulb fill="currentColor" size={15} />
						{t("about_this_game")}
					</TypographySmall>

					<div className="flex flex-1 items-center justify-end gap-7">
						{!!isReleased && (data?.aggregated_rating ?? 0) > 0 && (
							<Stars stars={(data?.aggregated_rating ?? 0) / 10} />
						)}

						<TypographySmall className="flex items-center gap-2 rounded-full bg-secondary/20 p-2.5 font-semibold">
							{!isReleased
								? t("not_released")
								: !releaseDate?.date
									? "N/A"
									: format(releaseDate.date * 1000, "MMM d, yyyy")}
						</TypographySmall>
					</div>
				</div>

				<div className="flex items-start justify-between gap-2">
					<div className="flex items-center gap-1.5">
						{isSameDevAndPublisherSame ? (
							<TypographySmall
								key={publisher?.company?.id}
								className="flex items-center gap-2 truncate rounded-full bg-secondary/20 p-2.5 font-semibold"
							>
								{developer?.company?.name ?? "N/A"}
							</TypographySmall>
						) : (
							<>
								<TypographySmall
									key={publisher?.company?.id}
									className="flex items-center gap-2 truncate rounded-full bg-secondary/20 p-2.5 font-semibold"
								>
									{publisher?.company?.name ?? "N/A"}
								</TypographySmall>

								<TypographySmall
									key={developer?.company?.id}
									className="flex items-center gap-2 truncate rounded-full bg-secondary/20 p-2.5 font-semibold"
								>
									{developer?.company?.name ?? "N/A"}
								</TypographySmall>
							</>
						)}
					</div>

					{!!genres && (
						<div className="flex items-center gap-1.5">
							{genres.map((genre) => (
								<TypographySmall
									key={genre?.slug}
									className="flex items-center gap-2 truncate rounded-full bg-secondary/20 p-2.5 font-semibold"
								>
									{genre?.name}
								</TypographySmall>
							))}
						</div>
					)}
				</div>

				<TypographyMuted className="-mt-1 line-clamp-4 text-pretty">
					{data?.storyline ?? data?.summary ?? ""}
				</TypographyMuted>
			</div>

			{!!isReleased && !isPending && !!data && (
				<div className="">
					<Sources
						title={data?.name}
						websites={data?.websites}
						slug={data?.slug}
						itadData={itadData}
						itadError={itadError}
						itadPending={itadPending}
						game_data={{
							banner_id: data.screenshots?.[0].image_id,
							id: data.id,
							image_id: data.cover?.image_id,
							name: data.name,
						}}
					/>
				</div>
			)}
		</>
	);
};

export default InfoAboutTab;
