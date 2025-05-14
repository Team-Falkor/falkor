import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib";
import { Button } from "./ui/button";
import { useCarousel } from "./ui/carousel";

interface CarouselButtonProps {
	direction: "left" | "right";
	className?: string;
	id?: string;
}

const CarouselButton = ({ direction, className, id }: CarouselButtonProps) => {
	const { scrollNext, scrollPrev, canScrollNext, canScrollPrev } =
		useCarousel();

	return (
		<Button
			id={id}
			className={cn("carousel-button", className)}
			variant={"ghost"}
			size={"icon"}
			onClick={direction === "left" ? scrollPrev : scrollNext}
			disabled={direction === "left" ? !canScrollPrev : !canScrollNext}
		>
			{direction === "left" ? (
				<ChevronLeft
					className={cn("cursor-button-pointer-left", "size-6", className)}
				/>
			) : (
				<ChevronRight
					className={cn("cursor-button-pointer-right", "size-6", className)}
				/>
			)}
		</Button>
	);
};

export default CarouselButton;
