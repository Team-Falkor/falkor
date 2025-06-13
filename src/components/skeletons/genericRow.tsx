import DefaultCardSkeleton from "@/components/skeletons/defaultCard";

const GenericRowSkeleton = () => {
	return (
		<section className="flex justify-between gap-2">
			{[...Array(6)].map((_, index) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: fine for skeletons
				<DefaultCardSkeleton key={index} />
			))}
		</section>
	);
};

export default GenericRowSkeleton;
