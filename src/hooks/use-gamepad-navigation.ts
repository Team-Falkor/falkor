import { useEffect, useRef } from "react";

// Button mappings for different controller types
const BUTTON_MAPPINGS = {
	// Standard gamepad mapping (most common)
	standard: {
		UP: 12,
		DOWN: 13,
		LEFT: 14,
		RIGHT: 15,
		A: 0,
		B: 1,
		X: 2,
		Y: 3,
		SELECT: 8,
		START: 9,
		L1: 4,
		R1: 5,
		L2: 6,
		R2: 7,
		L3: 10,
		R3: 11,
	},
	// Steam Deck and similar handheld mappings
	steamdeck: {
		UP: 12,
		DOWN: 13,
		LEFT: 14,
		RIGHT: 15,
		A: 1, // Different from standard
		B: 0, // Different from standard
		X: 3, // Different from standard
		Y: 2, // Different from standard
		SELECT: 8,
		START: 9,
		L1: 4,
		R1: 5,
		L2: 6,
		R2: 7,
		L3: 10,
		R3: 11,
	},
};

// Detect controller type based on gamepad ID
function getControllerMapping(gamepad: Gamepad) {
	const id = gamepad.id.toLowerCase();

	// Steam Deck detection
	if (id.includes("steam") || id.includes("deck") || id.includes("valve")) {
		return BUTTON_MAPPINGS.steamdeck;
	}

	// Nintendo Switch Pro Controller uses non-standard mapping
	if (id.includes("pro controller") || id.includes("nintendo")) {
		return BUTTON_MAPPINGS.steamdeck; // Similar to Steam Deck
	}

	// Xbox controllers usually follow standard mapping
	if (id.includes("xbox") || id.includes("xinput")) {
		return BUTTON_MAPPINGS.standard;
	}

	// PlayStation controllers
	if (
		id.includes("dualshock") ||
		id.includes("dualsense") ||
		id.includes("playstation")
	) {
		return BUTTON_MAPPINGS.standard;
	}

	// Default to standard mapping
	return BUTTON_MAPPINGS.standard;
}

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
			el.offsetParent !== null &&
			// Additional checks for better visibility detection
			el.offsetWidth > 0 &&
			el.offsetHeight > 0,
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

// Enhanced thresholds for better handheld experience
const STICK_THRESHOLD = 0.5; // Higher threshold to prevent accidental navigation
const STICK_COOLDOWN = 300; // Longer cooldown to prevent rapid movement
const STICK_DEAD_ZONE = 0.15; // Larger dead zone for better control
const STICK_MAX_THRESHOLD = 0.8; // Maximum threshold for fastest navigation
// const TRIGGER_THRESHOLD = 0.1; // For L2/R2 trigger detection

interface GamepadState {
	gamepad: Gamepad;
	mapping: typeof BUTTON_MAPPINGS.standard;
	lastButtonState: boolean[];
	lastStickTime: { [key in Direction]: number };
	lastTriggerState: { L2: boolean; R2: boolean };
}

export function useGamepadNavigation() {
	const gamepadStateRef = useRef<GamepadState | null>(null);
	const forceRefreshRef = useRef<boolean>(false);

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
				// Initialize or update gamepad state
				if (
					!gamepadStateRef.current ||
					gamepadStateRef.current.gamepad.index !== currentFrameGamepad.index ||
					gamepadStateRef.current.gamepad.id !== currentFrameGamepad.id ||
					forceRefreshRef.current
				) {
					forceRefreshRef.current = false; // Reset the force refresh flag
					const mapping = getControllerMapping(currentFrameGamepad);
					console.log(
						`Gamepad detected in polling: ${currentFrameGamepad.id}`,
						`Mapping: ${mapping === BUTTON_MAPPINGS.steamdeck ? "Steam Deck/Nintendo" : "Standard"}`,
					);

					gamepadStateRef.current = {
						gamepad: currentFrameGamepad,
						mapping,
						lastButtonState: [],
						lastStickTime: { up: 0, down: 0, left: 0, right: 0 },
						lastTriggerState: { L2: false, R2: false },
					};
				}

				const state = gamepadStateRef.current;
				const { buttons, axes } = currentFrameGamepad;
				const { mapping } = state;

				// Enhanced button press detection
				function isPressed(btnIndex: number): boolean {
					const wasPressed = state.lastButtonState[btnIndex];
					const isCurrentlyPressed = buttons[btnIndex]?.pressed;
					return Boolean(isCurrentlyPressed && !wasPressed);
				}

				const focusables = getFocusableElements();
				const active = document.activeElement as HTMLElement | null;

				// D-pad navigation
				if (isPressed(mapping.UP)) {
					const next = getNextElement(active, focusables, "up");
					if (next) next.focus();
				}
				if (isPressed(mapping.DOWN)) {
					const next = getNextElement(active, focusables, "down");
					if (next) next.focus();
				}
				if (isPressed(mapping.LEFT)) {
					const next = getNextElement(active, focusables, "left");
					if (next) next.focus();
				}
				if (isPressed(mapping.RIGHT)) {
					const next = getNextElement(active, focusables, "right");
					if (next) next.focus();
				}

				// Enhanced analog stick navigation with improved dead zone and velocity handling
				if (axes && axes.length >= 2) {
					const rawStickX = axes[0] || 0;
					const rawStickY = axes[1] || 0;

					// Apply dead zone - only register movement outside dead zone
					const stickX = Math.abs(rawStickX) > STICK_DEAD_ZONE ? rawStickX : 0;
					const stickY = Math.abs(rawStickY) > STICK_DEAD_ZONE ? rawStickY : 0;

					// Calculate dynamic cooldown based on stick intensity
					const getStickCooldown = (intensity: number): number => {
						const normalizedIntensity = Math.min(Math.abs(intensity), 1);
						if (normalizedIntensity > STICK_MAX_THRESHOLD) {
							return STICK_COOLDOWN * 0.6; // Faster for full stick deflection
						}
						if (normalizedIntensity > STICK_THRESHOLD) {
							return STICK_COOLDOWN; // Normal speed
						}
						return STICK_COOLDOWN * 1.5; // Slower for light touches
					};

					// Vertical stick movement with improved threshold handling
					if (stickY < -STICK_THRESHOLD) {
						const cooldown = getStickCooldown(stickY);
						if (now - state.lastStickTime.up > cooldown) {
							const next = getNextElement(active, focusables, "up");
							if (next) {
								next.focus();
								state.lastStickTime.up = now;
							}
						}
					} else if (stickY > STICK_THRESHOLD) {
						const cooldown = getStickCooldown(stickY);
						if (now - state.lastStickTime.down > cooldown) {
							const next = getNextElement(active, focusables, "down");
							if (next) {
								next.focus();
								state.lastStickTime.down = now;
							}
						}
					}

					// Horizontal stick movement with improved threshold handling
					if (stickX < -STICK_THRESHOLD) {
						const cooldown = getStickCooldown(stickX);
						if (now - state.lastStickTime.left > cooldown) {
							const next = getNextElement(active, focusables, "left");
							if (next) {
								next.focus();
								state.lastStickTime.left = now;
							}
						}
					} else if (stickX > STICK_THRESHOLD) {
						const cooldown = getStickCooldown(stickX);
						if (now - state.lastStickTime.right > cooldown) {
							const next = getNextElement(active, focusables, "right");
							if (next) {
								next.focus();
								state.lastStickTime.right = now;
							}
						}
					}

					// Reset stick timers when stick returns to dead zone
					if (Math.abs(stickX) <= STICK_DEAD_ZONE) {
						state.lastStickTime.left = 0;
						state.lastStickTime.right = 0;
					}
					if (Math.abs(stickY) <= STICK_DEAD_ZONE) {
						state.lastStickTime.up = 0;
						state.lastStickTime.down = 0;
					}
				}

				// Enhanced button actions
				if (isPressed(mapping.A)) {
					if (active && typeof active.click === "function") {
						active.click();
					}
				}

				// B button for back/cancel (common on handhelds)
				if (isPressed(mapping.B)) {
					// Try to find and click a close/cancel/back button
					const cancelButton = focusables.find(
						(el) =>
							el.textContent?.toLowerCase().includes("cancel") ||
							el.textContent?.toLowerCase().includes("close") ||
							el.textContent?.toLowerCase().includes("back") ||
							el.getAttribute("aria-label")?.toLowerCase().includes("close"),
					);

					if (cancelButton) {
						cancelButton.click();
					} else {
						// Fallback: simulate escape key
						document.dispatchEvent(
							new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
						);
					}
				}

				// Shoulder buttons for page navigation
				if (isPressed(mapping.L1)) {
					// Previous page/section
					window.scrollBy(0, -window.innerHeight * 0.8);
				}

				if (isPressed(mapping.R1)) {
					// Next page/section
					window.scrollBy(0, window.innerHeight * 0.8);
				}

				// Start/Select buttons
				if (isPressed(mapping.START)) {
					// Try to find and focus main menu or settings
					const menuButton = focusables.find(
						(el) =>
							el.textContent?.toLowerCase().includes("menu") ||
							el.textContent?.toLowerCase().includes("settings") ||
							el.getAttribute("aria-label")?.toLowerCase().includes("menu"),
					);
					if (menuButton) menuButton.focus();
				}

				if (isPressed(mapping.SELECT)) {
					// Focus first focusable element (useful for navigation reset)
					if (focusables[0]) focusables[0].focus();
				}

				// Update button state
				state.lastButtonState = buttons.map((b) => b.pressed);

				// Update gamepad reference
				state.gamepad = currentFrameGamepad;
			} else {
				// No gamepad connected
				if (gamepadStateRef.current) {
					console.log("Gamepad disconnected");
					gamepadStateRef.current = null;
				}
			}

			animationFrame = requestAnimationFrame(pollGamepads);
		}

		const handleGamepadConnected = (event: GamepadEvent) => {
			console.log(
				"Gamepad connected:",
				event.gamepad.id,
				"Index:",
				event.gamepad.index,
			);

			// Immediately initialize gamepad state when connected
			const mapping = getControllerMapping(event.gamepad);
			gamepadStateRef.current = {
				gamepad: event.gamepad,
				mapping,
				lastButtonState: [],
				lastStickTime: { up: 0, down: 0, left: 0, right: 0 },
				lastTriggerState: { L2: false, R2: false },
			};

			// Force a refresh in the next polling cycle
			forceRefreshRef.current = true;
		};

		const handleGamepadDisconnected = (event: GamepadEvent) => {
			console.log(
				"Gamepad disconnected:",
				event.gamepad.id,
				"Index:",
				event.gamepad.index,
			);

			if (
				gamepadStateRef.current &&
				gamepadStateRef.current.gamepad.index === event.gamepad.index
			) {
				gamepadStateRef.current = null;
			}
		};

		// Add keyboard navigation fallback for development/testing
		const handleKeyDown = (event: KeyboardEvent) => {
			if (gamepadStateRef.current) return; // Only handle keyboard if no gamepad

			const focusables = getFocusableElements();
			const active = document.activeElement as HTMLElement | null;

			switch (event.key) {
				case "ArrowUp": {
					event.preventDefault();
					const upNext = getNextElement(active, focusables, "up");
					if (upNext) upNext.focus();
					break;
				}
				case "ArrowDown": {
					event.preventDefault();
					const downNext = getNextElement(active, focusables, "down");
					if (downNext) downNext.focus();
					break;
				}
				case "ArrowLeft": {
					event.preventDefault();
					const leftNext = getNextElement(active, focusables, "left");
					if (leftNext) leftNext.focus();
					break;
				}
				case "ArrowRight": {
					event.preventDefault();
					const rightNext = getNextElement(active, focusables, "right");
					if (rightNext) rightNext.focus();
					break;
				}
			}
		};

		window.addEventListener("gamepadconnected", handleGamepadConnected);
		window.addEventListener("gamepaddisconnected", handleGamepadDisconnected);
		window.addEventListener("keydown", handleKeyDown);

		animationFrame = requestAnimationFrame(pollGamepads);

		return () => {
			if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
			window.removeEventListener("gamepadconnected", handleGamepadConnected);
			window.removeEventListener(
				"gamepaddisconnected",
				handleGamepadDisconnected,
			);
			window.removeEventListener("keydown", handleKeyDown);
			console.log("Enhanced gamepad navigation cleaned up");
		};
	}, []);

	// Return useful information about the current gamepad state
	return {
		isConnected: !!gamepadStateRef.current,
		gamepadId: gamepadStateRef.current?.gamepad.id || null,
		mappingType:
			gamepadStateRef.current?.mapping === BUTTON_MAPPINGS.steamdeck
				? "handheld"
				: "standard",
	};
}
