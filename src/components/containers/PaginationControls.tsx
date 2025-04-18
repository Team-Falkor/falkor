import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import { TypographyMuted } from "../ui/typography";

type PaginationControlsProps = {
  page: number;
  isPending: boolean;
  hasMore: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export const PaginationControls = ({
  page,
  isPending,
  hasMore,
  onPrevPage,
  onNextPage,
}: PaginationControlsProps) => {
  return (
    <div className="flex items-center justify-between mt-6">
      <Button
        variant="outline"
        onClick={onPrevPage}
        disabled={page === 1 || isPending}
        size="sm"
      >
        <ChevronLeft className="mr-1 size-4" />
        Previous
      </Button>
      <TypographyMuted>Page {page}</TypographyMuted>
      <Button
        variant="outline"
        onClick={onNextPage}
        disabled={!hasMore || isPending}
        size="sm"
      >
        Next
        <ChevronRight className="ml-1 size-4" />
      </Button>
    </div>
  );
};
