import { useEffect, useRef } from "react";

/**
 * Button index mappings for different gamepad types.
 * These correspond to the standard Gamepad API button indices.
 */
const BUTTON_MAPPINGS = {
	/** Xbox controllers, PlayStation controllers, and most generic gamepads */
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
	/** Steam Deck, Nintendo Switch Pro Controller, and similar handhelds */
	steamdeck: {
		UP: 12,
		DOWN: 13,
		LEFT: 14,
		RIGHT: 15,
		A: 1, // Swapped with B compared to standard
		B: 0, // Swapped with A compared to standard
		X: 3, // Swapped with Y compared to standard
		Y: 2, // Swapped with X compared to standard
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

/**
 * Determines the appropriate button mapping based on the gamepad's identifier string.
 * @param gamepad - The connected gamepad object
 * @returns The button mapping configuration for the detected controller type
 */
function getControllerMapping(gamepad: Gamepad) {
	const id = gamepad.id.toLowerCase();

	if (id.includes("steam") || id.includes("deck") || id.includes("valve")) {
		return BUTTON_MAPPINGS.steamdeck;
	}

	if (id.includes("pro controller") || id.includes("nintendo")) {
		return BUTTON_MAPPINGS.steamdeck;
	}

	if (id.includes("xbox") || id.includes("xinput")) {
		return BUTTON_MAPPINGS.standard;
	}

	if (
		id.includes("dualshock") ||
		id.includes("dualsense") ||
		id.includes("playstation")
	) {
		return BUTTON_MAPPINGS.standard;
	}

	return BUTTON_MAPPINGS.standard;
}

type Direction = "up" | "down" | "left" | "right";

/**
 * Finds all focusable elements currently visible on the page.
 * @returns Array of HTML elements that can receive focus
 */
function getFocusableElements(): HTMLElement[] {
	return Array.from(
		document.querySelectorAll<HTMLElement>(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
		),
	).filter(
		(el) =>
			!el.hasAttribute("disabled") &&
			el.getAttribute("aria-hidden") !== "true" &&
			el.offsetParent !== null && // Element is visible in DOM
			el.offsetWidth > 0 &&
			el.offsetHeight > 0, // Element has actual dimensions
	);
}

/**
 * Gets the bounding rectangle for an element.
 */
function getRect(el: HTMLElement) {
	return el.getBoundingClientRect();
}

/**
 * Finds the next focusable element in the specified direction using spatial navigation.
 * Uses a scoring algorithm that considers distance and alignment.
 * @param current - Currently focused element (or null)
 * @param elements - Array of all focusable elements
 * @param direction - Direction to navigate (up, down, left, right)
 * @returns The best candidate element or null if none found
 */
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

		// Calculate center points for both elements
		const cx = currentRect.left + currentRect.width / 2;
		const cy = currentRect.top + currentRect.height / 2;
		const ex = rect.left + rect.width / 2;
		const ey = rect.top + rect.height / 2;

		let isCandidate = false;
		let score = Number.POSITIVE_INFINITY;
		const overlapThreshold = 10; // Prevents selecting elements that are barely in the direction

		switch (direction) {
			case "up":
				isCandidate = ey < cy - overlapThreshold;
				if (isCandidate) {
					const horizontalPenalty = Math.abs(cx - ex) * 5; // Prefer vertically aligned elements
					const verticalDistance = cy - ey;
					const alignmentBonus = Math.abs(cx - ex) < 50 ? -20 : 0; // Bonus for good alignment
					score = horizontalPenalty + verticalDistance + alignmentBonus;
				}
				break;
			case "down":
				isCandidate = ey > cy + overlapThreshold;
				if (isCandidate) {
					const horizontalPenalty = Math.abs(cx - ex) * 5;
					const verticalDistance = ey - cy;
					const alignmentBonus = Math.abs(cx - ex) < 50 ? -20 : 0;
					score = horizontalPenalty + verticalDistance + alignmentBonus;
				}
				break;
			case "left":
				isCandidate = ex < cx - overlapThreshold;
				if (isCandidate) {
					const verticalPenalty = Math.abs(cy - ey) * 5; // Prefer horizontally aligned elements
					const horizontalDistance = cx - ex;
					const alignmentBonus = Math.abs(cy - ey) < 50 ? -20 : 0;
					score = verticalPenalty + horizontalDistance + alignmentBonus;
				}
				break;
			case "right":
				isCandidate = ex > cx + overlapThreshold;
				if (isCandidate) {
					const verticalPenalty = Math.abs(cy - ey) * 5;
					const horizontalDistance = ex - cx;
					const alignmentBonus = Math.abs(cy - ey) < 50 ? -20 : 0;
					score = verticalPenalty + horizontalDistance + alignmentBonus;
				}
				break;
		}

		if (isCandidate && score < bestScore) {
			best = el;
			bestScore = score;
		}
	}
	return best;
}

// Analog stick configuration for comfortable handheld gaming
const STICK_THRESHOLD = 0.5; // Minimum stick deflection to register movement
const STICK_COOLDOWN = 300; // Milliseconds between navigation actions
const STICK_DEAD_ZONE = 0.15; // Dead zone to prevent drift
const STICK_MAX_THRESHOLD = 0.8; // Full deflection threshold for faster navigation

interface GamepadState {
	gamepad: Gamepad;
	mapping: typeof BUTTON_MAPPINGS.standard;
	lastButtonState: boolean[];
	lastStickTime: { [key in Direction]: number };
}

/**
 * React hook that provides gamepad navigation for web interfaces.
 * Supports both D-pad and analog stick navigation, with fallback keyboard support.
 * Optimized for handheld gaming devices like Steam Deck.
 *
 * @returns Object containing connection status and gamepad information
 */
export function useGamepadNavigation() {
	const gamepadStateRef = useRef<GamepadState | null>(null);
	const forceRefreshRef = useRef<boolean>(false);
	const focusableCacheRef = useRef<{
		elements: HTMLElement[];
		timestamp: number;
	} | null>(null);

	useEffect(() => {
		let animationFrame: number | undefined;

		/**
		 * Main polling function that continuously checks gamepad state and handles navigation.
		 * Runs at 60fps using requestAnimationFrame for optimal performance.
		 */
		function pollGamepads() {
			try {
				const now = Date.now();
				const rawGamepads = navigator.getGamepads?.() ?? [];
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
						gamepadStateRef.current.gamepad.index !==
							currentFrameGamepad.index ||
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
							lastButtonState: new Array(
								currentFrameGamepad.buttons.length,
							).fill(false),
							lastStickTime: { up: 0, down: 0, left: 0, right: 0 },
						};
					}

					const state = gamepadStateRef.current;
					const { buttons, axes } = currentFrameGamepad;
					const { mapping } = state;

					// Enhanced button press detection
					function isPressed(btnIndex: number): boolean {
						if (btnIndex >= buttons.length) return false;
						const wasPressed = state.lastButtonState[btnIndex] ?? false;
						const isCurrentlyPressed = buttons[btnIndex]?.pressed ?? false;
						return isCurrentlyPressed && !wasPressed;
					}

					/**
					 * Returns cached focusable elements if still valid, otherwise fetches fresh ones.
					 * Cache expires after 100ms to balance performance with accuracy.
					 */
					function getCachedFocusableElements(): HTMLElement[] {
						const cacheTimeout = 100; // Cache for 100ms to improve performance
						if (
							!focusableCacheRef.current ||
							now - focusableCacheRef.current.timestamp > cacheTimeout
						) {
							focusableCacheRef.current = {
								elements: getFocusableElements(),
								timestamp: now,
							};
						}
						return focusableCacheRef.current.elements;
					}

					const focusables = getCachedFocusableElements();
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
						const stickX =
							Math.abs(rawStickX) > STICK_DEAD_ZONE ? rawStickX : 0;
						const stickY =
							Math.abs(rawStickY) > STICK_DEAD_ZONE ? rawStickY : 0;

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

					// Update button state efficiently
					for (let i = 0; i < buttons.length; i++) {
						state.lastButtonState[i] = buttons[i]?.pressed ?? false;
					}

					// Update gamepad reference
					state.gamepad = currentFrameGamepad;
				} else {
					// No gamepad connected
					if (gamepadStateRef.current) {
						console.log("Gamepad disconnected");
						gamepadStateRef.current = null;
					}
				}
			} catch (error) {
				console.error("Error in gamepad polling:", error);
			}
			animationFrame = requestAnimationFrame(pollGamepads);
		}

		/**
		 * Handles gamepad connection events and initializes the gamepad state.
		 */
		const handleGamepadConnected = (event: GamepadEvent) => {
			try {
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
					lastButtonState: new Array(event.gamepad.buttons.length).fill(false),
					lastStickTime: { up: 0, down: 0, left: 0, right: 0 },
				};

				// Force a refresh in the next polling cycle
				forceRefreshRef.current = true;
				// Clear focusable cache when gamepad connects
				focusableCacheRef.current = null;
			} catch (error) {
				console.error("Error handling gamepad connection:", error);
			}
		};

		/**
		 * Handles gamepad disconnection events and cleans up state.
		 */
		const handleGamepadDisconnected = (event: GamepadEvent) => {
			try {
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
					// Clear focusable cache when gamepad disconnects
					focusableCacheRef.current = null;
				}
			} catch (error) {
				console.error("Error handling gamepad disconnection:", error);
			}
		};

		/**
		 * Keyboard navigation fallback for when gamepad is not available.
		 * Provides arrow key navigation as a backup input method.
		 */
		const handleKeyDown = (event: KeyboardEvent) => {
			try {
				if (gamepadStateRef.current) return; // Only handle keyboard if no gamepad

				const focusables = getFocusableElements(); // Don't use cache for keyboard as it's less frequent
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
			} catch (error) {
				console.error("Error in keyboard navigation:", error);
			}
		};

		window.addEventListener("gamepadconnected", handleGamepadConnected);
		window.addEventListener("gamepaddisconnected", handleGamepadDisconnected);
		window.addEventListener("keydown", handleKeyDown);

		animationFrame = requestAnimationFrame(pollGamepads);

		// Cleanup function to remove all event listeners and cancel animation frames
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

	/**
	 * Return useful information about the current gamepad state for external components.
	 * This allows other parts of the application to react to gamepad connection status.
	 */
	return {
		isConnected: !!gamepadStateRef.current,
		gamepadId: gamepadStateRef.current?.gamepad.id || null,
		mappingType:
			gamepadStateRef.current?.mapping === BUTTON_MAPPINGS.steamdeck
				? "handheld"
				: "standard",
	};
}
