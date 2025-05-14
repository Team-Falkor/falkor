import { ChevronLeft } from "lucide-react";

interface BackButtonProps {
	onClick: () => void;
}

export const BackButton = ({ onClick }: BackButtonProps) => (
	<button
		onClick={onClick}
		className="flex cursor-pointer items-center gap-1 text-sm transition-opacity hover:opacity-80"
	>
		<ChevronLeft size={15} />
		Back
	</button>
);
