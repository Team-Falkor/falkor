import { createFileRoute } from "@tanstack/react-router";
import MainContainer from "@/components/containers/mainContainer";
import FeaturedGames from "@/features/home/components/FeaturedGames";
import GameCategories from "@/features/home/components/GameCategories";
import GameRows from "@/features/home/components/GameRows";
import HeroSection from "@/features/home/components/HeroSection";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
	return (
		<MainContainer id="main-page" className="w-full overflow-hidden">
			<HeroSection />
			<FeaturedGames />
			<GameCategories />
			<GameRows />
		</MainContainer>
	);
}
