import { Button } from "@/components/ui/button";
import { useSettings } from "@/features/settings/hooks/useSettings";

type Props = {
	type: "real-debrid" | "torbox";
};

export const SetAsPreferred = ({ type }: Props) => {
	const { updateSetting } = useSettings();

	return (
		<Button
			variant="ghost"
			className="size-fit w-full items-start justify-start bg-none"
			onClick={() =>
				updateSetting({
					path: "preferredDebridService",
					value: type?.toString(),
				})
			}
		>
			Set as preferred
		</Button>
	);
};
