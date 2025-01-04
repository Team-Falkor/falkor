import { igdb } from "@/lib";
import { goBack } from "@/lib/history";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import DefaultCard from "../cards/defaultCard";
import Spinner from "../spinner";
import { H1 } from "../typography/h1";
import { Button } from "../ui/button";
import MainContainer from "./mainContainer";

type Props = {
  title: string;
  dataToFetch: "mostAnticipated" | "topRated" | "newReleases";
};
export const Section = ({ title, dataToFetch }: Props) => {
  const limit = 50;
  const [page, setPage] = useState(1);
  const [offset, setOffset] = useState(0);

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
  };

  const handlePrevPage = () => {
    setPage((prev) => (prev === 1 ? prev : prev - 1));
    setOffset((prev) => (prev === 0 ? prev : prev - limit));
  };

  if (error) {
    window.location.reload();
    return null;
  }

  return (
    <MainContainer
      id={`${dataToFetch}-section`}
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
            {data?.map((game) => <DefaultCard key={game.id} {...game} />)}
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

            <span className="text-lg text-muted-foreground">Page {page}</span>

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
};
