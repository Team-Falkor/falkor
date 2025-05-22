import { useEffect, useState } from "react";

// Defines the standard and some common extended gamepad button names.
// This mapping is based on the standard XInput layout (common for Xbox controllers)
// and includes the common "Guide" button.
type GamepadButton =
	| "A"
	| "B"
	| "X"
	| "Y"
	| "LB" // Left Bumper
	| "RB" // Right Bumper
	| "LT" // Left Trigger
	| "RT" // Right Trigger
	| "SELECT" // Often 'Back' or 'View' button
	| "START" // Often 'Menu' or 'Start' button
	| "LS" // Left Stick press
	| "RS" // Right Stick press
	| "UP" // D-pad Up
	| "DOWN" // D-pad Down
	| "LEFT" // D-pad Left
	| "RIGHT" // D-pad Right
	| "GUIDE"; // Xbox/PS/Steam button, often index 16

// Maps the descriptive button names to their standard numerical indices.
// This layout is common for many gamepads, including Xbox controllers
// and the Steam Deck when it emulates an XInput device.
// Note: Buttons beyond the core 0-15 might have varying support or mapping
// across different controllers and platforms, but 'GUIDE' at 16 is fairly common.
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
	GUIDE: 16, // The "Guide" button (e.g., Xbox logo, PS button)
};

/**
 * Custom React hook to listen for a specific gamepad button press.
 * It ensures the callback is triggered only once per press.
 *
 * @param button The button to listen for. Can be a string name (e.g., "A", "GUIDE")
 *               or its numerical index.
 * @param callback The function to call when the button is pressed.
 */
const useGamepadButton = (
	button: keyof typeof gamepadMapping | number,
	callback: () => void,
) => {
	// Tracks if the button is currently considered "pressed" by our logic
	// to prevent firing the callback multiple times for a single hold.
	const [buttonPressed, setButtonPressed] = useState(false);

	useEffect(() => {
		// Determine the numerical index for the button.
		const buttonIndex =
			typeof button === "number" ? button : gamepadMapping[button];

		// If the button name isn't in our mapping, warn the developer.
		if (buttonIndex === undefined) {
			console.warn(
				`Gamepad button "${button}" is not recognized or mapped. ` +
					"For less common buttons, you might need to pass the numerical index directly.",
			);
			return; // Early exit if button is invalid.
		}

		const handleGamepadInput = () => {
			// navigator.getGamepads() can return null for slots without connected gamepads.
			const gamepads = navigator.getGamepads();

			for (const gamepad of gamepads) {
				if (!gamepad) continue; // Skip if no gamepad in this slot.

				// Ensure the button index is within the bounds of the gamepad's buttons array.
				if (buttonIndex >= gamepad.buttons.length) {
					// This gamepad doesn't have this button (e.g., a simpler controller).
					// We can choose to warn here, or just silently ignore.
					// For now, let's assume if it's not there, it can't be pressed.
					continue;
				}

				const isPressed = gamepad.buttons[buttonIndex]?.pressed;

				if (isPressed && !buttonPressed) {
					// Button just got pressed (was not pressed before).
					setButtonPressed(true);
					callback(); // Trigger the callback.
				} else if (!isPressed && buttonPressed) {
					// Button just got released (was pressed before).
					setButtonPressed(false); // Reset state for the next press.
				}
			}
		};

		// Poll for gamepad input. 16ms is roughly 60 times per second.
		const intervalId = setInterval(handleGamepadInput, 16);

		// Cleanup: stop polling when the component unmounts or dependencies change.
		return () => clearInterval(intervalId);
	}, [button, callback, buttonPressed]); // Re-run effect if button, callback, or pressed state changes.

	return null; // This hook is for side effects, doesn't need to return a value.
};

export default useGamepadButton;
