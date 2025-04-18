import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ListsDropdownContent from "@/features/lists/components/dropdownContent";
import NewListDialogContent from "@/features/lists/components/newListDialogContent";
import { IGDBReturnDataType } from "@/lib/api/igdb/types";
import { Bookmark } from "lucide-react";
import { useState } from "react";

export const AddToListButton = (props: IGDBReturnDataType) => {
  const [openDialog, setOpenDialog] = useState(false);

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="gap-2" variant={"functional"}>
            <Bookmark size={15} className="fill-current" />
            Add to list
          </Button>
        </DropdownMenuTrigger>

        <ListsDropdownContent {...props} align="end" />
      </DropdownMenu>

      <NewListDialogContent open={openDialog} setOpen={setOpenDialog} />
    </Dialog>
  );
};
