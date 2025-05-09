import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import type { IGDBReturnDataType } from "@/@types";
import { useLanguageContext } from "@/i18n/I18N";
import IGDBImage from "../IGDBImage";
import TrailerButton from "../trailer";
import { buttonVariants } from "../ui/button";
import { H2, TypographySmall } from "../ui/typography";

const BannerCard = ({
	screenshots: ss,
	cover,
	name,
	summary,
	storyline,
	id,
	videos,
}: IGDBReturnDataType) => {
	const { t } = useLanguageContext();

	const start = 1;
	const howMany = 3;

	// Memoize the screenshots to extract only a certain range
	const screenshots = useMemo(() => {
		return ss?.filter(
			(_item, index) => index >= start && index < howMany + start,
		);
	}, [ss]);

	return (
		<div className="group relative h-[28rem] w-full overflow-hidden rounded-lg rounded-t-none transition-all duration-300 ease-in-out">
			<div className="absolute inset-0 z-0 h-full w-full overflow-hidden">
				<div className="absolute z-1 h-full w-full bg-gradient-to-t from-background via-background/80 to-transparent opacity-90" />
				<IGDBImage
					imageSize="720p"
					imageId={cover.image_id}
					className="h-full w-full scale-100 transform object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
					alt={name}
				/>
			</div>

			<div className="relative z-10 flex h-full w-full flex-col justify-end gap-3 p-6">
				<H2 className="font-bold text-4xl tracking-tight">{name}</H2>
				<TypographySmall className="line-clamp-2 max-w-[70%] text-muted-foreground/90">
					{storyline ?? summary ?? "??"}
				</TypographySmall>
				<div className="flex flex-row justify-end">
					<div className="flex w-full flex-row items-end justify-between gap-6">
						<div className="mt-4 flex flex-row justify-start gap-4">
							{screenshots?.map((screenshot) => (
								<IGDBImage
									imageSize="screenshot_med"
									key={screenshot.id}
									imageId={screenshot.image_id}
									className="aspect-video w-48 rounded-lg object-cover shadow-lg transition-transform duration-300 ease-in-out hover:scale-105 lg:w-56"
									alt={name}
								/>
							))}
						</div>

						<div className="flex flex-row gap-4">
							<TrailerButton name={name} videos={videos} />
							<Link
								className={buttonVariants({})}
								to="/info/$id"
								params={{ id: id.toString() }}
							>
								{t("more_info")}
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default BannerCard;
