import { ProtonDBTierColor } from "@/@types";
import { trpc } from "@/lib";
import protondb from "/protondb.png";

interface Props {
	appId: string;
}

const ProtonDbBadge = ({ appId }: Props) => {
	const { data, error, isPending } = trpc.protondb.getBadge.useQuery({
		appId,
	});

	console.log({ data });
	if (isPending || error) return null;
	if (!data) return null;

	const { tier } = data;

	if (tier === "pending" || !tier) return null;

	const color = ProtonDBTierColor[tier as keyof typeof ProtonDBTierColor];

	return (
		<div
			className="flex h-8 items-center justify-center gap-0.5 overflow-hidden px-3 py-1"
			style={{ backgroundColor: color }}
		>
			<img
				src={protondb}
				className="size-full object-contain"
				alt="Proton Db Badge"
				aria-label="Proton Db Badge"
			/>
			{/* <span className="text-lg font-bold text-black uppercase">{tier}</span> */}
		</div>
	);
};

export default ProtonDbBadge;
