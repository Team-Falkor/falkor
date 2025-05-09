import { Disc3 } from "lucide-react";

interface SpinnerProps {
	size?: number;
	className?: string;
}

const GameLoader = ({ size = 24, className = "" }: SpinnerProps) => (
	<Disc3 className={`animate-spin ${className}`} width={size} height={size} />
);

export default GameLoader;
