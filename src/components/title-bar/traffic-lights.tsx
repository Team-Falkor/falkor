import TitleBarControl from "./control";

const TitleBarTrafficLights = () => {
	return (
		<>
			<TitleBarControl
				className="fill-yellow-400 group-focus-states:fill-yellow-500 group-focus-visible:fill-yellow-500"
				controlType="minimize"
			/>
			<TitleBarControl
				className="fill-green-400 group-focus-states:fill-green-500 group-focus-visible:fill-green-500"
				controlType="maximize"
			/>
			<TitleBarControl
				className="fill-red-400 group-focus-states:fill-red-500 group-focus-visible:fill-red-500"
				controlType="close"
			/>
		</>
	);
};

export default TitleBarTrafficLights;
