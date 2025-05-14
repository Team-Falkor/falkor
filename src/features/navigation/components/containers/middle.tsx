import { Carousel, CarouselContent } from "@/components/ui/carousel";
// import { useGames } from "@/features/library/hooks/useGames";
// import NavBarContinuePlayingCard from "../cards/playing";

export const NavBarMiddle = () => {
	// const { games } = useGames(true);

	// const gamesToShow = useMemo(() => {
	//   const gamesArray = Object.values(games);
	//   if (!gamesArray?.length) return [];
	//   gamesArray.sort(
	//     (a, b) => Number(b.game_last_played) - Number(a.game_last_played)
	//   );
	//   return gamesArray.slice(0, 5);
	// }, [games]);

	// if (!Object.values(games)?.length) return null;

	return (
		<div className="h-full">
			<Carousel
				orientation="vertical"
				opts={{
					skipSnaps: true,
					dragFree: true,
					loop: false,
				}}
				className="h-full"
			>
				<CarouselContent className="h-full">
					{/* {...gamesToShow.map((game) => {
            return (
              <CarouselItem key={game.id}>
                <NavBarContinuePlayingCard {...game} />
              </CarouselItem>
            );
          })} */}
				</CarouselContent>
			</Carousel>
		</div>
	);
};
