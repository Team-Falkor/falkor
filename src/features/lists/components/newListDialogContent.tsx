import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguageContext } from "@/contexts/I18N";
import { Dispatch, SetStateAction, useRef } from "react";
import { toast } from "sonner";
import { useLists } from "../hooks/useLists";

interface NewListDialogContentProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const NewListDialogContent = ({ open, setOpen }: NewListDialogContentProps) => {
  const { t } = useLanguageContext();
  const { createList, loading } = useLists();
  const listNameRef = useRef<HTMLInputElement>(null);
  const listDescriptionRef = useRef<HTMLInputElement>(null);

  const onSubmit = async () => {
    if (!open) return;
    const name = listNameRef.current?.value.trim();

    if (!name) {
      toast.error("List name cannot be empty", {
        description: "Please provide a valid name.",
      });
      return;
    }

    try {
      await createList(name, listDescriptionRef.current?.value);
      setOpen(false);
      toast.success("List created successfully!");
    } catch (error) {
      console.error(error);
      toast.error("There was an error creating the list", {
        description: "Please try again",
      });
    }
  };

  return (
    <DialogContent className="max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{t("create_new_list")}</DialogTitle>
        <DialogDescription>
          {t("fill_in_the_information_below_to_create_a_new_list")}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-3 pt-2">
        <Label htmlFor="collectionName">Name</Label>
        <Input
          ref={listNameRef}
          id="listName"
          placeholder={t("enter_list_name")}
          type="text"
          className="w-full"
          minLength={1}
          maxLength={64}
          autoComplete={"off"}
          disabled={loading}
        />
      </div>

      <div className="grid gap-3 pt-1 pb-3">
        <Label htmlFor="collectionDescription">{t("description")}</Label>
        <Input
          ref={listDescriptionRef}
          id="listDescription"
          placeholder={t("enter_list_description")}
          type="text"
          className="w-full"
          minLength={1}
          maxLength={64}
          autoComplete={"off"}
          disabled={loading}
        />
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant={"destructive"} disabled={loading}>
            Cancel
          </Button>
        </DialogClose>
        <Button onClick={onSubmit} disabled={loading}>
          {loading ? "Creating..." : "Create"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default NewListDialogContent;
