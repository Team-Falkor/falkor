import type { ActiveLibraryProps } from "./active-library";

const LibraryHeader = (props: ActiveLibraryProps) => {
	return (
		<header className="flex flex-col items-start justify-center">
			<h3 className="font-semibold text-xl">{props.title}</h3>
			{props.type === "list" && props.description && (
				<p className="text-gray-500 text-sm">{props.description}</p>
			)}
		</header>
	);
};

export default LibraryHeader;
