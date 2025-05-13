import { useCallback, useEffect, useRef } from "react";

/**
 * Creates a debounced version of a callback function
 * @template Args - The argument types of the callback function
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced version of the callback function
 */
export const useDebounce = <Args extends unknown[]>(
	callback: (...args: Args) => void,
	delay: number,
): ((...args: Args) => void) => {
	const timer = useRef<NodeJS.Timeout | null>(null);

	const debouncedCallback = useCallback(
		(...args: Args) => {
			if (timer.current) {
				clearTimeout(timer.current);
			}

			timer.current = setTimeout(() => {
				callback(...args);
				timer.current = null;
			}, delay);
		},
		[callback, delay],
	);

	useEffect(() => {
		return () => {
			if (timer.current) {
				clearTimeout(timer.current);
			}
		};
	}, []);

	return debouncedCallback;
};
