import { Link } from "@tanstack/react-router";
import { type HTMLAttributes, useMemo } from "react";
import { useLanguageContext } from "@/i18n/I18N";
import { cn } from "@/lib";
import CarouselButton from "../carouselButton";
import GenericRow from "../genericRow";
import { Carousel } from "../ui/carousel";
import { H2, TypographySmall } from "../ui/typography";

type FetchCategory = "most_anticipated" | "top_rated" | "new_releases";

interface RowContainerProps extends HTMLAttributes<HTMLDivElement> {
	title: string;
	dataToFetch: FetchCategory;
	id?: string;
}

const MS_IN_90_DAYS = 90 * 24 * 60 * 60 * 1000;
const date90DaysAgo = Date.now() - MS_IN_90_DAYS;

const queryParamsMap = {
	most_anticipated: {
		sort: "hypes desc",
		releaseDateFrom: Date.now(),
		onlyMainGames: true,
		limit: 50,
		offset: 0,
	},
	top_rated: {
		sort: "aggregated_rating desc",
		minRating: 75,
		minRatingCount: 5,
		onlyMainGames: true,
		limit: 50,
		offset: 0,
	},
	new_releases: {
		sort: "first_release_date desc",
		releaseDateFrom: date90DaysAgo,
		releaseDateTo: Date.now(),
		onlyMainGames: true,
		limit: 50,
		offset: 0,
	},
};

/**
 * Generates search parameters for the filter page based on a category.
 * @param category The category of games to fetch.
 * @returns The search parameters for the Link component.
 */
const getCategorySearchParams = (category: FetchCategory) => {
	return queryParamsMap[category];
};

const RowContainer = ({
	dataToFetch,
	title,
	className,
	id,
	...props
}: RowContainerProps) => {
	const { t } = useLanguageContext();

	const searchParams = useMemo(
		() => getCategorySearchParams(dataToFetch),
		[dataToFetch],
	);

	return (
		<div className={cn("mx-auto", className)} id={id} {...props}>
			<Carousel
				id={id}
				opts={{
					skipSnaps: true,
					dragFree: true,
				}}
			>
				<div className="flex items-center justify-between pb-2">
					<div className="flex items-end gap-2">
						<H2>{title}</H2>

						{/* This Link will now generate the correct, flattened URL */}
						<Link
							to={"/filter"}
							search={searchParams}
							className="text-muted-foreground focus-states:underline"
						>
							<TypographySmall>{t("view_more")}</TypographySmall>
						</Link>
					</div>

					<div>
						<CarouselButton direction="left" id={`${dataToFetch}-left-btn`} />
						<CarouselButton direction="right" id={`${dataToFetch}-right-btn`} />
					</div>
				</div>

				<GenericRow dataToFetch={dataToFetch} />
			</Carousel>
		</div>
	);
};

export default RowContainer;
