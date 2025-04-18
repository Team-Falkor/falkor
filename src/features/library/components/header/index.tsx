import { Book, Play } from "lucide-react";
import LibraryListActions from "./listActions";
import { H2, P } from "@/components/ui/typography";

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
    <div className="flex flex-col gap-1.5 justify-center">
      <div className="flex items-center gap-3">
        {type === "game" ? (
          <Play size={25} className="fill-white" />
        ) : (
          <Book size={30} className="" />
        )}
        <H2>{title}</H2>
        {type === "list" && (
          <LibraryListActions listId={props.listId} key={props.listId} />
        )}
      </div>
      {type === "list" && props.description && (
        <P className="text-muted-foreground">{props.description}</P>
      )}
    </div>
  );
};

export default LibraryHeader;
