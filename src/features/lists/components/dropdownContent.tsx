import { DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useLanguageContext } from "@/contexts/I18N";
import { IGDBReturnDataType } from "@/lib/api/igdb/types";
import { useQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useLists } from "../hooks/useLists";
import ListsDropdownItem from "./dropdownItem";
import { P } from "@/components/ui/typography";

type Props = IGDBReturnDataType & {
  align?: "start" | "end" | "center" | undefined;
};

const ListsDropdownContent = (props: Props) => {
  const { t } = useLanguageContext();
  const { fetchLists, lists } = useLists();

  const { isLoading, error } = useQuery({
    queryKey: ["lists", "all"],
    queryFn: fetchLists,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return null;

  return (
    <DropdownMenuContent className="max-w-sm" align={props?.align ?? "start"}>
      <DropdownMenuLabel className="w-full truncate">
        {t("add-to-list")}
      </DropdownMenuLabel>

      <DropdownMenuSeparator />

      <div className="overflow-y-auto max-h-24">
        {!lists?.length ? (
          <div className="flex items-center justify-center gap-2 p-2">
            <P className="text-center">{t("create_new_list")}</P>
          </div>
        ) : (
          lists.map((list) => (
            <ListsDropdownItem key={list.id} list_id={list.id} game={props}>
              {list.name}
            </ListsDropdownItem>
          ))
        )}
      </div>

      <DropdownMenuSeparator />

      <DropdownMenuItem>
        <DialogTrigger>
          <div className="flex items-center gap-1.5">
            <PlusIcon className="size-5 " />
            <P>Create a new list</P>
          </div>
        </DialogTrigger>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
};

export default ListsDropdownContent;
