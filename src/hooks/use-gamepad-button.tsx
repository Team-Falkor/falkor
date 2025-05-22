import { useEffect, useState } from "react";

type GamepadButton =
	| "A"
	| "B"
	| "X"
	| "Y"
	| "LB"
	| "RB"
	| "LT"
	| "RT"
	| "SELECT"
	| "START"
	| "LS"
	| "RS"
	| "UP"
	| "DOWN"
	| "LEFT"
	| "RIGHT";

const gamepadMapping: Record<GamepadButton, number> = {
	A: 0,
	B: 1,
	X: 2,
	Y: 3,
	LB: 4,
	RB: 5,
	LT: 6,
	RT: 7,
	SELECT: 8,
	START: 9,
	LS: 10,
	RS: 11,
	UP: 12,
	DOWN: 13,
	LEFT: 14,
	RIGHT: 15,
};

const useGamepadButton = (
	button: keyof typeof gamepadMapping | number,
	callback: () => void,
) => {
	const [buttonPressed, setButtonPressed] = useState(false);

	useEffect(() => {
		const buttonIndex =
			typeof button === "number" ? button : gamepadMapping[button];

		if (buttonIndex === undefined) {
			console.warn(`Gamepad button "${button}" is not mapped.`);
			return;
		}

		const handleGamepadInput = () => {
			const gamepads = navigator.getGamepads();

			for (const gamepad of gamepads) {
				if (!gamepad) continue;

				const isPressed = gamepad.buttons[buttonIndex]?.pressed;

				if (isPressed && !buttonPressed) {
					setButtonPressed(true);
					callback(); // Trigger callback only on the press.
				} else if (!isPressed && buttonPressed) {
					setButtonPressed(false); // Reset state when released.
				}
			}
		};

		const interval = setInterval(handleGamepadInput, 16); // Run at ~60fps.

		return () => clearInterval(interval);
	}, [button, callback, buttonPressed]);

	return null;
};

export default useGamepadButton;
