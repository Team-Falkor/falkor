import { type ChangeEvent, useState } from "react";
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
		<Input
			className="bg min-w-72"
			placeholder="Enter API URL"
			value={inputValue}
			onChange={handleInputChange}
		/>
	);
};
