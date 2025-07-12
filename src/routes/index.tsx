import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { QuickAccess } from "@/features/quick-access/components/quickAccess";

const MainContainer = lazy(
	() => import("@/components/containers/mainContainer"),
);
const FeaturedGames = lazy(
	() => import("@/features/home/components/FeaturedGames"),
);
const GameCategories = lazy(
	() => import("@/features/home/components/GameCategories"),
);
const GameRows = lazy(() => import("@/features/home/components/GameRows"));

export const Route = createFileRoute("/")({ component: Index });

function Index() {
	return (
		<MainContainer id="home-screen" className="w-full overflow-hidden">
			{/* <HeroSection /> */}
			<QuickAccess />
			<FeaturedGames />
			<GameCategories />
			<GameRows />
		</MainContainer>
	);
}
