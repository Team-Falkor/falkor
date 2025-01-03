import Confirmation from "@/components/confirmation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLists } from "@/features/lists/hooks/useLists";
import { t } from "i18next";
import { Ellipsis } from "lucide-react";

interface Props {
  listId: number;
}

const LibraryListActions = ({ listId }: Props) => {
  const { deleteList, fetchLists } = useLists();

  return (
    <div className="flex gap-1.5 ml-1">
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="ghost" size={"icon"}>
            <Ellipsis size={23} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-24" align="start">
          <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <Confirmation
            onConfirm={async () => {
              await deleteList(listId);
              await fetchLists();
            }}
          >
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              {t("delete")}
            </DropdownMenuItem>
          </Confirmation>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default LibraryListActions;
