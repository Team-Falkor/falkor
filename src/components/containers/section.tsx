import { igdb } from "@/lib";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import Spinner from "../spinner";
import { TypographyMuted } from "../ui/typography";
import { GameGrid } from "./GameGrid";
import { HeaderSection } from "./HeaderSection";
import MainContainer from "./mainContainer";
import { PaginationControls } from "./PaginationControls";

type Props = {
  title: string;
  dataToFetch: "mostAnticipated" | "topRated" | "newReleases";
};

const subtitles: Record<Props["dataToFetch"], string> = {
  mostAnticipated: "Upcoming games everyone's waiting for",
  topRated: "The best-rated games across the board",
  newReleases: "Fresh out of the oven — the newest games available",
};

const getSubtitle = (fetchType: Props["dataToFetch"]) => {
  return subtitles[fetchType] ?? "Discover exciting games curated just for you";
};

export const Section = ({ title, dataToFetch }: Props) => {
  const limit = 50;
  const [page, setPage] = useState(1);
  const [offset, setOffset] = useState(0);

  const ref = useRef<HTMLDivElement>(null);

  const fetcher = async () => {
    const data = await igdb[dataToFetch](limit, offset);
    return data;
  };

  const { data, isPending, error } = useQuery({
    queryKey: ["igdb", dataToFetch, "all", page],
    queryFn: fetcher,
  });

  const handleNextPage = () => {
    setPage((prev) => prev + 1);
    setOffset((prev) => prev + limit);
    ref.current?.scrollTo(0, 0);
  };

  const handlePrevPage = () => {
    if (page === 1) return;
    setPage((prev) => prev - 1);
    setOffset((prev) => prev - limit);
    ref.current?.scrollTo(0, 0);
  };

  const subtitle = getSubtitle(dataToFetch);

  if (error) {
    console.error("Error fetching data:", error);
    return (
      <MainContainer className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <TypographyMuted>
          Failed to load data. Please try again later.
        </TypographyMuted>
      </MainContainer>
    );
  }

  return (
    <MainContainer
      id={`${dataToFetch}-section`}
      className="flex flex-col gap-6 pt-6 sm:pt-8"
      ref={ref}
    >
      <HeaderSection title={title} subtitle={subtitle} />
      {isPending ? (
        <div className="flex items-center justify-center h-[calc(100vh-15rem)]">
          <Spinner size={23} />
        </div>
      ) : (
        <>
          <GameGrid data={data || []} />
          {data && data.length > 0 && (
            <PaginationControls
              page={page}
              isPending={isPending}
              hasMore={data.length >= limit}
              onPrevPage={handlePrevPage}
              onNextPage={handleNextPage}
            />
          )}
        </>
      )}
    </MainContainer>
  );
};
