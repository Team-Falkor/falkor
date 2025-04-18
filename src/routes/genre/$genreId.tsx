import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";

import { GameGrid } from "@/components/containers/GameGrid";
import { HeaderSection } from "@/components/containers/HeaderSection";
import MainContainer from "@/components/containers/mainContainer";
import { PaginationControls } from "@/components/containers/PaginationControls";
import Spinner from "@/components/spinner";

import { genreAPI } from "@/lib";
import { Genre, IGDBReturnDataType } from "@/lib/api/igdb/types";

interface GenrePageData {
  genre: Genre | null;
  games: IGDBReturnDataType[];
}

export const Route = createFileRoute("/genre/$genreId")({
  component: GenreRoute,
});

function GenreRoute() {
  const { genreId } = useParams({ from: "/genre/$genreId" });
  const [page, setPage] = useState(1);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const fetchGenrePageData = async (): Promise<GenrePageData> => {
    try {
      const genre = await genreAPI.getGenreById(genreId);
      const games = await genreAPI.getGamesByGenreId(genreId, limit, offset);
      return { genre, games };
    } catch (error) {
      console.error("Error fetching genre page data:", error);
      return { genre: null, games: [] };
    }
  };

  const { data, isPending, error } = useQuery<GenrePageData>({
    queryKey: ["genre", genreId, page],
    queryFn: fetchGenrePageData,
  });

  const handleNextPage = () => {
    setPage((prev) => prev + 1);
    setOffset((prev) => prev + limit);
  };

  const handlePrevPage = () => {
    setPage((prev) => Math.max(1, prev - 1));
    setOffset((prev) => Math.max(0, prev - limit));
  };

  if (error) {
    window.location.reload();
    return null;
  }

  const genre = data?.genre;
  const games = data?.games ?? [];
  const title = genre?.name || "Loading...";
  const subtitle = genre?.name
    ? `Browse top games in the ${genre.name} genre`
    : "Loading genre information...";

  return (
    <MainContainer
      id={`genre-${genreId}-section`}
      className="flex flex-col gap-6 pt-6 sm:pt-8"
    >
      <HeaderSection title={title} subtitle={subtitle} />

      {isPending ? (
        <div className="flex items-center justify-center h-[calc(100vh-15rem)]">
          <Spinner size={23} />
        </div>
      ) : (
        <>
          <GameGrid data={games} />
          {games.length > 0 && (
            <PaginationControls
              page={page}
              isPending={isPending}
              hasMore={games.length >= limit}
              onPrevPage={handlePrevPage}
              onNextPage={handleNextPage}
            />
          )}
        </>
      )}
    </MainContainer>
  );
}
