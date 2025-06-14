import { Loader2 } from "lucide-react";

export default function SearchSpinner() {
	return (
		<div className="flex items-center justify-center gap-2 py-6 text-muted-foreground text-sm">
			<Loader2 className="h-4 w-4 animate-spin" />
			<span>Loading...</span>
		</div>
	);
}
