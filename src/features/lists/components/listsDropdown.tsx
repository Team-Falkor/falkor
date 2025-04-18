import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IGDBReturnDataType } from "@/lib/api/igdb/types";
import { List } from "lucide-react";
import { useState } from "react";
import ListsDropdownContent from "./dropdownContent";
import NewListDialogContent from "./newListDialogContent";

const ListsDropdown = (props: IGDBReturnDataType) => {
  const [openDialog, setOpenDialog] = useState(false);

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size={"icon"}>
            <List className="size-5" />
          </Button>
        </DropdownMenuTrigger>

        <ListsDropdownContent {...props} />
      </DropdownMenu>

      <NewListDialogContent open={openDialog} setOpen={setOpenDialog} />
    </Dialog>
  );
};

export default ListsDropdown;
