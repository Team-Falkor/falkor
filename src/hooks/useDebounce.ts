import { useCallback, useEffect, useRef } from "react";

export const useDebounce = (
	callback: (...args: any[]) => void,
	delay: number,
) => {
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const debouncedCallback = useCallback(
		(...args: any[]) => {
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
