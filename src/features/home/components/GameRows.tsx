import RowContainer from "@/components/containers/row";
import { useLanguageContext } from "@/contexts/I18N";

const GameRows = () => {
  const { t } = useLanguageContext();

  return (
    <div className="space-y-14">
      <RowContainer
        id="new-releases-row"
        title={t("sections.new_releases")}
        dataToFetch="newReleases"
        className="ring-1 ring-muted/20 rounded-xl p-4 shadow-xs bg-linear-to-r from-background to-secondary/5"
      />

      <RowContainer
        id="most-anticipated-row"
        title={t("sections.most_anticipated")}
        dataToFetch="mostAnticipated"
        className="ring-1 ring-muted/20 rounded-xl p-4 shadow-xs bg-linear-to-r from-background to-secondary/5"
      />
    </div>
  );
};

export default GameRows;