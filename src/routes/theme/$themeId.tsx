import DefaultCard from "@/components/cards/defaultCard";
import MainContainer from "@/components/containers/mainContainer";
import Spinner from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { H1, TypographyMuted } from "@/components/ui/typography";
import { themeAPI } from "@/lib/api/igdb/theme";
import { IGDBReturnDataType, Theme } from "@/lib/api/igdb/types";
import { goBack } from "@/lib/history";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

// Combined data type for theme page
interface ThemePageData {
  theme: Theme | null;
  games: IGDBReturnDataType[];
}

export const Route = createFileRoute("/theme/$themeId")({
  component: ThemeRoute,
});

function ThemeRoute() {
  const { themeId } = useParams({ from: "/theme/$themeId" });
  const limit = 50;
  const [page, setPage] = useState(1);
  const [offset, setOffset] = useState(0);

  // Combined fetcher function that gets both theme and games data
  const fetchThemePageData = async (): Promise<ThemePageData> => {
    try {
      // Fetch theme details
      const themeData = await themeAPI.getThemeById(themeId);

      // Fetch games for this theme
      const gamesData = await themeAPI.getGamesByThemeId(
        themeId,
        limit,
        offset
      );

      console.log({
        themeData,
        gamesData,
      });

      return {
        theme: themeData,
        games: gamesData,
      };
    } catch (error) {
      console.error("Error fetching theme page data:", error);
      return {
        theme: null,
        games: [],
      };
    }
  };

  // Single query that fetches both theme and games data
  const { data, isPending, error } = useQuery<ThemePageData>({
    queryKey: ["theme", "page", themeId, page],
    queryFn: fetchThemePageData,
  });

  const handleNextPage = () => {
    setPage((prev) => prev + 1);
    setOffset((prev) => prev + limit);
  };

  const handlePrevPage = () => {
    setPage((prev) => (prev === 1 ? prev : prev - 1));
    setOffset((prev) => (prev === 0 ? prev : prev - limit));
  };

  if (error) {
    window.location.reload();
    return null;
  }

  // Extract data from the combined query result
  const themeData = data?.theme;
  const gamesData = data?.games || [];
  const title = themeData?.name?.length ? themeData.name : "Loading...";

  return (
    <MainContainer
      id={`theme-${themeId}-section`}
      className="flex flex-col gap-8"
    >
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => goBack()}
          className="mt-1"
        >
          <ChevronLeft className="size-8" />
        </Button>

        <H1>{title}</H1>
      </div>

      {!isPending ? (
        <>
          <div
            className="grid gap-5"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            }}
          >
            {gamesData.map((game) => (
              <DefaultCard key={game.id} {...game} />
            ))}
          </div>

          <div className="flex justify-between flex-1 mt-4">
            <Button
              variant={"ghost"}
              onClick={handlePrevPage}
              disabled={page === 1}
              size={"icon"}
            >
              <ChevronLeft />
            </Button>

            <TypographyMuted>Page {page}</TypographyMuted>

            <Button variant={"ghost"} onClick={handleNextPage} size={"icon"}>
              <ChevronRight />
            </Button>
          </div>
        </>
      ) : (
        <div className="w-full flex items-center justify-center h-[calc(100vh-10rem)]">
          <Spinner size={23} />
        </div>
      )}
    </MainContainer>
  );
}
