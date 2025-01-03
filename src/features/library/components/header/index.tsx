import { Book, Play } from "lucide-react";
import LibraryListActions from "./listActions";

interface GameProps {
  type: "game";
  title: string;
}

interface ListProps {
  type: "list";
  listId: number;
  title: string;
  description?: string;
}

type Props = GameProps | ListProps;

const LibraryHeader = (props: Props) => {
  const { type, title } = props;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-3">
        {type === "game" ? (
          <Play size={25} className="fill-white" />
        ) : (
          <Book size={30} className="" />
        )}
        <h2 className="text-2xl font-bold capitalize flex=1 truncate">
          {title}
        </h2>
        {type === "list" && (
          <LibraryListActions listId={props.listId} key={props.listId} />
        )}
      </div>
      {type === "list" && props.description && (
        <div className="text-muted-foreground">{props.description}</div>
      )}
    </div>
  );
};

export default LibraryHeader;
