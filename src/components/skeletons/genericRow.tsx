import DefaultCardSkeleton from "@/components/skeletons/defaultCard";

const GenericRowSkeleton = () => {
	return (
		<section className="flex justify-between gap-2">
			{[...Array(6)].map((_, index) => (
				<DefaultCardSkeleton key={index} />
			))}
		</section>
	);
};

export default GenericRowSkeleton;
