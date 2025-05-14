import type { IGDBReturnDataType } from "@/@types";
import { useLanguageContext } from "@/i18n/I18N";
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
