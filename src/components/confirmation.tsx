import { useLanguageContext } from "@/contexts/I18N";
import { PropsWithChildren } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

interface ConfirmationProps {
  onConfirm: () => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
}

const Confirmation = ({
  onConfirm,
  children,
  onCancel,
  title,
  description,
}: PropsWithChildren<ConfirmationProps>) => {
  const { t } = useLanguageContext();

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t(title ? title : "are_you_absolutely_sure")}
          </DialogTitle>

          <DialogDescription>
            {t(
              description ? description : "are_you_absolutely_sure_description"
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose>
            <Button variant={"destructive"} onClick={onCancel}>
              {t("cancel")}
            </Button>
          </DialogClose>
          <DialogClose>
            <Button type="submit" variant={"secondary"} onClick={onConfirm}>
              {t("confirm")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Confirmation;
