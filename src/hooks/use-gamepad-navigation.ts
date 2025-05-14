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
	if (!current) return elements[0] || null;
	const currentRect = getRect(current);

	let best: HTMLElement | null = null;
	let bestScore = Number.POSITIVE_INFINITY;

	for (const el of elements) {
		if (el === current) continue;
		const rect = getRect(el);

		// Calculate center points
		const cx = currentRect.left + currentRect.width / 2;
		const cy = currentRect.top + currentRect.height / 2;
		const ex = rect.left + rect.width / 2;
		const ey = rect.top + rect.height / 2;

		// Directional filtering and scoring
		let isCandidate = false;
		let score = Number.POSITIVE_INFINITY;

		switch (direction) {
			case "up":
				isCandidate = ey < cy - 5;
				score = Math.abs(cx - ex) * 2 + (cy - ey);
				break;
			case "down":
				isCandidate = ey > cy + 5;
				score = Math.abs(cx - ex) * 2 + (ey - cy);
				break;
			case "left":
				isCandidate = ex < cx - 5;
				score = Math.abs(cy - ey) * 2 + (cx - ex);
				break;
			case "right":
				isCandidate = ex > cx + 5;
				score = Math.abs(cy - ey) * 2 + (ex - cx);
				break;
		}

		if (isCandidate && score < bestScore) {
			best = el;
			bestScore = score;
		}
	}

	return best;
}

const STICK_THRESHOLD = 0.5; // How far the stick must be pushed to trigger
const STICK_COOLDOWN = 200; // ms between stick moves

export function useGamepadNavigation() {
	const lastButtonState = useRef<boolean[]>([]);
	const lastStickTime = useRef<{ [key in Direction]: number }>({
		up: 0,
		down: 0,
		left: 0,
		right: 0,
	});

	useEffect(() => {
		let animationFrame: number | undefined;

		function pollGamepads() {
			const now = Date.now();
			const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];

			for (const gamepad of gamepads) {
				if (!gamepad) continue;
				const { buttons, axes } = gamepad;

				function isPressed(btnIndex: number): boolean {
					return (
						buttons[btnIndex]?.pressed && !lastButtonState.current[btnIndex]
					);
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

				// Analog stick navigation (left stick: axes[0] = X, axes[1] = Y)
				if (axes && axes.length >= 2) {
					// Up
					if (
						axes[1] < -STICK_THRESHOLD &&
						now - lastStickTime.current.up > STICK_COOLDOWN
					) {
						const next = getNextElement(active, focusables, "up");
						if (next) next.focus();
						lastStickTime.current.up = now;
					} else if (
						axes[1] > STICK_THRESHOLD &&
						now - lastStickTime.current.down > STICK_COOLDOWN
					) {
						// Down
						const next = getNextElement(active, focusables, "down");
						if (next) next.focus();
						lastStickTime.current.down = now;
					} else if (
						axes[0] < -STICK_THRESHOLD &&
						now - lastStickTime.current.left > STICK_COOLDOWN
					) {
						// Left
						const next = getNextElement(active, focusables, "left");
						if (next) next.focus();
						lastStickTime.current.left = now;
					} else if (
						axes[0] > STICK_THRESHOLD &&
						now - lastStickTime.current.right > STICK_COOLDOWN
					) {
						// Right
						const next = getNextElement(active, focusables, "right");
						if (next) next.focus();
						lastStickTime.current.right = now;
					}

					// Reset cooldown if stick is released
					if (Math.abs(axes[0]) < STICK_THRESHOLD) {
						lastStickTime.current.left = 0;
						lastStickTime.current.right = 0;
					}
					if (Math.abs(axes[1]) < STICK_THRESHOLD) {
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

				lastButtonState.current = buttons.map((b) => b.pressed);
			}

			animationFrame = requestAnimationFrame(pollGamepads);
		}

		animationFrame = requestAnimationFrame(pollGamepads);

		return () => {
			if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
		};
	}, []);
}
