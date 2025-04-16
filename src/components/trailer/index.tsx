import { useLanguageContext } from "@/contexts/I18N";
import { IGDBReturnDataType } from "@/lib/api/igdb/types";
import { Button } from "../ui/button";
import { Dialog, DialogTrigger } from "../ui/dialog";
import TrailerDialogContent from "./dialogContent";

type Props = Pick<IGDBReturnDataType, "name" | "videos">;

const TrailerButton = (props: Props) => {
  const { t } = useLanguageContext();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="capitalize">{t("trailer")}</Button>
      </DialogTrigger>

      <TrailerDialogContent {...props} />
    </Dialog>
  );
};

export default TrailerButton;
