import type { PropsWithChildren } from "react";

const SettingsContainer = ({ children }: PropsWithChildren) => {
	return (
		<div className="relative flex flex-col gap-4 p-4 px-7">{children}</div>
	);
};

export default SettingsContainer;
