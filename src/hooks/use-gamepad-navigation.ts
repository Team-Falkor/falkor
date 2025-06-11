import { useEffect, useRef } from "react";

// Button indices for standard controllers
const BUTTONS = {
	UP: 12,
	DOWN: 13,
	LEFT: 14,
	RIGHT: 15,
	A: 0,
	B: 1,
};

type Direction = "up" | "down" | "left" | "right";

function getFocusableElements(): HTMLElement[] {
	return Array.from(
		document.querySelectorAll<HTMLElement>(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
		),
	).filter(
		(el) =>
			!el.hasAttribute("disabled") &&
			!el.getAttribute("aria-hidden") &&
			el.offsetParent !== null,
	);
}

function getRect(el: HTMLElement) {
	return el.getBoundingClientRect();
}

function getNextElement(
	current: HTMLElement | null,
	elements: HTMLElement[],
	direction: Direction,
): HTMLElement | null {
	if (!elements.length) return null;
	if (!current) return elements[0] || null;

	const currentRect = getRect(current);
	let best: HTMLElement | null = null;
	let bestScore = Number.POSITIVE_INFINITY;

	for (const el of elements) {
		if (el === current) continue;
		const rect = getRect(el);

		const cx = currentRect.left + currentRect.width / 2;
		const cy = currentRect.top + currentRect.height / 2;
		const ex = rect.left + rect.width / 2;
		const ey = rect.top + rect.height / 2;

		let isCandidate = false;
		let score = Number.POSITIVE_INFINITY;
		const overlapThreshold = 5;

		switch (direction) {
			case "up":
				isCandidate = ey < cy - overlapThreshold;
				if (isCandidate) score = Math.abs(cx - ex) * 2 + (cy - ey);
				break;
			case "down":
				isCandidate = ey > cy + overlapThreshold;
				if (isCandidate) score = Math.abs(cx - ex) * 2 + (ey - cy);
				break;
			case "left":
				isCandidate = ex < cx - overlapThreshold;
				if (isCandidate) score = Math.abs(cy - ey) * 2 + (cx - ex);
				break;
			case "right":
				isCandidate = ex > cx + overlapThreshold;
				if (isCandidate) score = Math.abs(cy - ey) * 2 + (ex - cx);
				break;
		}

		if (isCandidate && score < bestScore) {
			best = el;
			bestScore = score;
		}
	}
	return best;
}

const STICK_THRESHOLD = 0.5;
const STICK_COOLDOWN = 200; // ms

export function useGamepadNavigation() {
	const lastButtonState = useRef<boolean[]>([]);
	const lastStickTime = useRef<{ [key in Direction]: number }>({
		up: 0,
		down: 0,
		left: 0,
		right: 0,
	});
	// gamepadRef stores the Gamepad object that pollGamepads has decided is active
	const gamepadRef = useRef<Gamepad | null>(null);

	useEffect(() => {
		let animationFrame: number | undefined;

		function pollGamepads() {
			const now = Date.now();
			const rawGamepads = navigator.getGamepads ? navigator.getGamepads() : [];
			let currentFrameGamepad: Gamepad | null = null;

			// Find the first connected, non-null gamepad for this frame
			for (const pad of rawGamepads) {
				if (pad?.connected) {
					currentFrameGamepad = pad;
					break;
				}
			}

			if (currentFrameGamepad) {
				// A gamepad is active for this frame.
				// Update gamepadRef if this is a new/different gamepad.
				if (
					!gamepadRef.current ||
					gamepadRef.current.index !== currentFrameGamepad.index
				) {
					console.log(
						`Gamepad selected/changed. Index: ${currentFrameGamepad.index}, ID: ${currentFrameGamepad.id}`,
					);
					// Optional: More detailed logging for the new gamepad
					// console.log("Full Gamepad Object:", currentFrameGamepad);
					// console.log("Mapping:", currentFrameGamepad.mapping);
					// console.log("Buttons:", currentFrameGamepad.buttons.length, "Axes:", currentFrameGamepad.axes.length);
					gamepadRef.current = currentFrameGamepad;
				}

				// IMPORTANT: Use currentFrameGamepad for all operations in this frame
				// This ensures we are using the live object from navigator.getGamepads()
				const { buttons, axes } = currentFrameGamepad;

				function isPressed(btnIndex: number): boolean {
					const wasPressed = lastButtonState.current[btnIndex];
					const isCurrentlyPressed = buttons[btnIndex]?.pressed;
					if (isCurrentlyPressed && !wasPressed) {
						// console.log(`Input: Button ${btnIndex} pressed.`); // Verbose
					}
					return Boolean(isCurrentlyPressed && !wasPressed);
				}

				const focusables = getFocusableElements();
				const active = document.activeElement as HTMLElement | null;

				// D-pad navigation
				if (isPressed(BUTTONS.UP)) {
					const next = getNextElement(active, focusables, "up");
					if (next) next.focus();
				}
				if (isPressed(BUTTONS.DOWN)) {
					const next = getNextElement(active, focusables, "down");
					if (next) next.focus();
				}
				if (isPressed(BUTTONS.LEFT)) {
					const next = getNextElement(active, focusables, "left");
					if (next) next.focus();
				}
				if (isPressed(BUTTONS.RIGHT)) {
					const next = getNextElement(active, focusables, "right");
					if (next) next.focus();
				}

				// Analog stick navigation
				if (axes && axes.length >= 2) {
					const stickX = axes[0];
					const stickY = axes[1];

					if (
						stickY < -STICK_THRESHOLD &&
						now - lastStickTime.current.up > STICK_COOLDOWN
					) {
						const next = getNextElement(active, focusables, "up");
						if (next) next.focus();
						lastStickTime.current.up = now;
					} else if (
						stickY > STICK_THRESHOLD &&
						now - lastStickTime.current.down > STICK_COOLDOWN
					) {
						const next = getNextElement(active, focusables, "down");
						if (next) next.focus();
						lastStickTime.current.down = now;
					} else if (
						stickX < -STICK_THRESHOLD &&
						now - lastStickTime.current.left > STICK_COOLDOWN
					) {
						const next = getNextElement(active, focusables, "left");
						if (next) next.focus();
						lastStickTime.current.left = now;
					} else if (
						stickX > STICK_THRESHOLD &&
						now - lastStickTime.current.right > STICK_COOLDOWN
					) {
						const next = getNextElement(active, focusables, "right");
						if (next) next.focus();
						lastStickTime.current.right = now;
					}

					if (Math.abs(stickX) < STICK_THRESHOLD) {
						lastStickTime.current.left = 0;
						lastStickTime.current.right = 0;
					}
					if (Math.abs(stickY) < STICK_THRESHOLD) {
						lastStickTime.current.up = 0;
						lastStickTime.current.down = 0;
					}
				}

				// A button: click
				if (isPressed(BUTTONS.A)) {
					if (active && typeof active.click === "function") {
						active.click();
					}
				}

				// Update lastButtonState based on the fresh buttons from currentFrameGamepad
				lastButtonState.current = buttons.map((b) => b.pressed);
			} else {
				// No gamepad connected in this frame
				if (gamepadRef.current) {
					console.log(
						"Tracked gamepad seems disconnected:",
						gamepadRef.current.id,
					);
					gamepadRef.current = null; // Clear our tracked ref
				}
				// Ensure lastButtonState is cleared or appropriately sized if no gamepad
				if (lastButtonState.current.length > 0) {
					lastButtonState.current = [];
				}
			}

			animationFrame = requestAnimationFrame(pollGamepads);
		}

		const handleGamepadConnected = (event: GamepadEvent) => {
			console.log(
				"Event: Gamepad connected - ID:",
				event.gamepad.id,
				"Index:",
				event.gamepad.index,
			);
			// If no gamepad is currently tracked by pollGamepads, or if this is a different one,
			// let pollGamepads pick it up. This handler primarily logs.
			// We could set gamepadRef.current here as a hint, but pollGamepads will verify.
			if (!gamepadRef.current) {
				// gamepadRef.current = event.gamepad; // Tentatively set
				// pollGamepads will confirm and use it if it's still valid in the next frame
			}
		};

		const handleGamepadDisconnected = (event: GamepadEvent) => {
			console.log(
				"Event: Gamepad disconnected - ID:",
				event.gamepad.id,
				"Index:",
				event.gamepad.index,
			);
			if (
				gamepadRef.current &&
				gamepadRef.current.index === event.gamepad.index
			) {
				console.log(
					"Tracked gamepad disconnected via event:",
					gamepadRef.current.id,
				);
				gamepadRef.current = null;
			}
		};

		window.addEventListener("gamepadconnected", handleGamepadConnected);
		window.addEventListener("gamepaddisconnected", handleGamepadDisconnected);

		animationFrame = requestAnimationFrame(pollGamepads);

		return () => {
			if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
			window.removeEventListener("gamepadconnected", handleGamepadConnected);
			window.removeEventListener(
				"gamepaddisconnected",
				handleGamepadDisconnected,
			);
			console.log("Gamepad navigation hook cleaned up.");
		};
	}, []); // Empty dependency array: runs once on mount, cleans up on unmount

	// The hook itself doesn't return anything, it just sets up the global listener
}
