import ActiveLibraryContent from "./active-library-content";
import LibraryHeader from "./library-header";

export type ActiveLibraryProps =
	| {
			title: string;
			type: "game";
	  }
	| {
			title: string;
			description?: string;
			type: "list";
			listId: number;
	  };

const ActiveLibrary = (props: ActiveLibraryProps) => {
	return (
		<div className="flex flex-col gap-4 rounded-lg p-6">
			<LibraryHeader {...props} />
			<div className="flex flex-wrap gap-6 rounded-lg bg-muted/30 p-6">
				<ActiveLibraryContent {...props} />
			</div>
		</div>
	);
};

export default ActiveLibrary;
