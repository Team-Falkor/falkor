import RowContainer from "@/components/containers/row";
import { useLanguageContext } from "@/i18n/I18N";

const GameRows = () => {
	const { t } = useLanguageContext();

	return (
		<div className="space-y-14">
			<RowContainer
				id="new-releases-row"
				title={t("sections.new_releases")}
				dataToFetch="new_releases"
				className="rounded-xl bg-linear-to-r from-background to-secondary/5 p-4 shadow-xs ring-1 ring-muted/20"
			/>

			<RowContainer
				id="most-anticipated-row"
				title={t("sections.most_anticipated")}
				dataToFetch="most_anticipated"
				className="rounded-xl bg-linear-to-r from-background to-secondary/5 p-4 shadow-xs ring-1 ring-muted/20"
			/>
		</div>
	);
};

export default GameRows;
