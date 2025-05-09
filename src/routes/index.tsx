import MainContainer from "@/components/containers/mainContainer";
import GameCategories from "@/features/home/components/GameCategories";
import GameRows from "@/features/home/components/GameRows";
import HeroSection from "@/features/home/components/HeroSection";
import FeaturedGames from "@/features/home/components/featuredGames";
import { createFileRoute } from "@tanstack/react-router";

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
