import { Link } from "@tanstack/react-router";
import type { HTMLAttributes } from "react";
import { useLanguageContext } from "@/i18n/I18N";
import { cn } from "@/lib";
import CarouselButton from "../carouselButton";
import GenericRow from "../genericRow";
import { Carousel } from "../ui/carousel";
import { H2, TypographySmall } from "../ui/typography";

interface RowContainerProps extends HTMLAttributes<HTMLDivElement> {
	title: string;
	dataToFetch: "most_anticipated" | "top_rated" | "new_releases";
	id?: string;
}

const RowContainer = ({
	dataToFetch,
	title,
	className,
	id,
	...props
}: RowContainerProps) => {
	const { t } = useLanguageContext();

	const getSearchParams = () => {
		switch (dataToFetch) {
			case "most_anticipated":
				return {
					options: {
						sort: "hype desc",
						minHypes: 10,
						onlyMainGames: true,
					},
					offset: 0,
					limit: 20,
				};

			case "top_rated":
				return {
					options: {
						sort: "rating desc",
						minRating: 75,
						minRatingCount: 5,
						onlyMainGames: true,
					},
					offset: 0,
					limit: 20,
				};

			case "new_releases":
				return {
					options: {
						sort: "first_release_date desc",
						releaseDateFrom: Math.floor(
							Date.now() / 1000 - 60 * 60 * 24 * 60, // last 60 days
						),
						onlyMainGames: true,
					},
					offset: 0,
					limit: 20,
				};

			default:
				return {
					offset: 0,
					limit: 20,
				};
		}
	};

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

						<Link
							to={"/filter"}
							search={getSearchParams()}
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
