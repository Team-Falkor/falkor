import { X } from "lucide-react";
import type { DownloadgameData, InfoItadProps, Website } from "@/@types";
import { Button } from "@/components/ui/button";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
} from "@/components/ui/carousel";
import { P, TypographySmall } from "@/components/ui/typography";
import { useSources } from "@/hooks";
import { useLanguageContext } from "@/i18n/I18N";
import SourceShowcase from "./soruces";

interface DownloadDialogProps extends InfoItadProps {
	title: string;
	slug?: string;
	websites: Website[];
	game_data: DownloadgameData;
}

const Sources = ({ itadData, title, game_data }: DownloadDialogProps) => {
	const { t } = useLanguageContext();
	const {
		providers,
		filteredSources,
		isError,
		selectedProvider,
		setSelectedProvider,
	} = useSources(title, itadData);

	return (
		<div className="flex w-full flex-col gap-1">
			<TypographySmall>{t("sources")}</TypographySmall>
			<div className="flex flex-col gap-2">
				<Carousel opts={{ skipSnaps: true, dragFree: true }}>
					<CarouselContent>
						{providers.map(({ value, label }) => (
							<CarouselItem key={value} className="relative basis-auto">
								<Button
									variant={
										selectedProvider.value === value ? "active" : "default"
									}
									onClick={() => setSelectedProvider({ value, label })}
								>
									{label}
								</Button>
							</CarouselItem>
						))}
					</CarouselContent>
				</Carousel>

				{isError ? (
					<P className="text-red-500">{t("error_loading_sources")}</P>
				) : filteredSources.length > 0 ? (
					<Carousel opts={{ skipSnaps: true, dragFree: true }} className="mt-2">
						<CarouselContent>
							<SourceShowcase game_data={game_data} sources={filteredSources} />
						</CarouselContent>
					</Carousel>
				) : (
					<div className="mt-2 flex items-center gap-2.5 font-bold text-sm">
						<X className="size-7" />
						<P>{t("no_sources_found")}</P>
					</div>
				)}
			</div>
		</div>
	);
};

export default Sources;
