import { Maximize2, Minus, X } from "lucide-react";
import TitleBarControlWithIcon from "./control";

const TitleBarIcons = () => {
	return (
		<>
			<TitleBarControlWithIcon controlType="minimize">
				<Minus
					size={22}
					className="transition-all group-focus-states:text-yellow-500"
				/>
			</TitleBarControlWithIcon>
			<TitleBarControlWithIcon controlType="maximize">
				<Maximize2 size={16} className="group-focus-states:text-green-500" />
			</TitleBarControlWithIcon>
			<TitleBarControlWithIcon controlType="close">
				<X size={22} className="group-focus-states:text-red-500" />
			</TitleBarControlWithIcon>
		</>
	);
};

export default TitleBarIcons;
