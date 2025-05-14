import { RotateCcw } from "lucide-react";
import { type ChangeEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/features/settings/hooks/useSettings";
import { useDebounce } from "@/hooks";

export const ChangeApiUrl = () => {
	const { settings, updateSetting } = useSettings();
	const [inputValue, setInputValue] = useState(settings?.api_base_url || "");

	const debouncedUpdateSetting = useDebounce((value: string) => {
		updateSetting({
			path: "api_base_url",
			value: value,
		});
	}, 1500);

	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;
		setInputValue(newValue);

		debouncedUpdateSetting(newValue);
	};

	return (
		<div className="flex min-w-72 flex-row">
			<Input
				className="peer flex-1 rounded-r-none focus-visible:ring-0"
				placeholder="Enter API URL"
				value={inputValue}
				onChange={handleInputChange}
			/>
			<Button
				className="rounded-l-none border border-input border-l-0"
				size={"icon"}
				disabled={!!inputValue.includes("api.falkor.moe")}
				onClick={() => {
					updateSetting(
						{
							path: "api_base_url",
							value: "https://api.falkor.moe",
						},
						{
							onSuccess: () => {
								setInputValue("https://api.falkor.moe/");
							},
						},
					);
				}}
			>
				<RotateCcw />
			</Button>
		</div>
	);
};
