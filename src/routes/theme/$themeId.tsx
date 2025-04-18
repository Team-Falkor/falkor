import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";

import { GameGrid } from "@/components/containers/GameGrid";
import { HeaderSection } from "@/components/containers/HeaderSection";
import MainContainer from "@/components/containers/mainContainer";
import { PaginationControls } from "@/components/containers/PaginationControls";
import Spinner from "@/components/spinner";

import { themeAPI } from "@/lib/api/igdb/theme";
import { IGDBReturnDataType, Theme } from "@/lib/api/igdb/types";

interface ThemePageData {
  theme: Theme | null;
  games: IGDBReturnDataType[];
}

export const Route = createFileRoute("/theme/$themeId")({
  component: ThemeRoute,
});

function ThemeRoute() {
  const { themeId } = useParams({ from: "/theme/$themeId" });
  const [page, setPage] = useState(1);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const fetchThemePageData = async (): Promise<ThemePageData> => {
    try {
      const theme = await themeAPI.getThemeById(themeId);
      const games = await themeAPI.getGamesByThemeId(themeId, limit, offset);
      return { theme, games };
    } catch (error) {
      console.error("Error fetching theme page data:", error);
      return { theme: null, games: [] };
    }
  };

  const { data, isPending, error } = useQuery<ThemePageData>({
    queryKey: ["theme", themeId, page],
    queryFn: fetchThemePageData,
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

  const theme = data?.theme;
  const games = data?.games ?? [];
  const title = theme?.name || "Loading...";
  const subtitle = theme?.name
    ? `Browse top games in the ${theme.name} theme`
    : "Loading theme information...";

  return (
    <MainContainer
      id={`theme-${themeId}-section`}
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
