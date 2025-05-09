import type EventEmitter from "node:events";

/**
 * A generic helper that resolves once the specified event is emitted.
 *
 * @template T The payload type of the event.
 * @param emitter Any EventEmitter instance.
 * @param eventName The name of the event to listen for.
 * @returns A promise that resolves with the event payload once emitted.
 */
export function emitOnce<T>(
	emitter: EventEmitter,
	eventName: string | symbol,
): Promise<T> {
	return new Promise<T>((resolve) => {
		// Attach a one-time listener
		emitter.once(eventName, (payload: T) => {
			resolve(payload);
		});
	});
}
