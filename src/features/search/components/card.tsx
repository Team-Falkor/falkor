import { IGDBReturnDataType } from "@/lib/api/igdb/types";
import { Link } from "@tanstack/react-router";

const SearchCard = ({
  name,
  id,
  setOpen,
  release_dates,
}: IGDBReturnDataType & {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const year = release_dates?.[0]?.human;

  return (
    <Link
      className="w-full px-6 py-2 border-b rounded-md cursor-default select-none hover:cursor-pointer hover:text-white"
      key={1}
      to={`/info/$id`}
      params={{ id: id.toString() }}
      onClick={() => setOpen(false)}
    >
      <div className="flex gap-1.5">
        <p className="flex-1 text-sm line-clamp-2">{name}</p>
        <span className="text-xs text-muted-foreground">({year})</span>
      </div>
    </Link>
  );
};

export default SearchCard;
