import type { Tab } from "@/@types";
import { Button } from "@/components/ui/button";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
} from "@/components/ui/carousel";
import { cn } from "@/lib";

interface TabCarouselProps {
	tabs: Tab[];
	activeTabName?: string;
	onTabSelect: (tab: Tab) => void;
	disabled?: boolean;
}

export function TabCarousel({
	tabs,
	activeTabName,
	onTabSelect,
	disabled,
}: TabCarouselProps) {
	return (
		<Carousel
			className="mx-3 flex-1"
			opts={{
				skipSnaps: true,
				dragFree: true,
				loop: false,
				align: "start",
			}}
		>
			<CarouselContent>
				{tabs.map((tab) => (
					<CarouselItem key={tab.name} className="basis-auto">
						<Button
							variant={activeTabName === tab.name ? "active" : "default"}
							className={cn(
								"gap-1.5 rounded-full font-semibold transition-all duration-75",
							)}
							onClick={() => {
								if (!disabled) {
									onTabSelect(tab);
								}
							}}
							aria-pressed={activeTabName === tab.name}
						>
							{tab.name}
						</Button>
					</CarouselItem>
				))}
			</CarouselContent>
		</Carousel>
	);
}
