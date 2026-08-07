import type { TourEventName } from "./types";

const CHANNEL = "cairn:event";

/**
 * Lets a step wait on real work rather than a Next button:
 *
 *   emitTourEvent("question:created");
 *
 * One line at the call site, and the only Cairn import a service needs.
 */
export function emitTourEvent(name: TourEventName): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CHANNEL, { detail: name }));
}

/** Subscribes to a single app event. Returns an unsubscribe function. */
export function onTourEvent(name: TourEventName, handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const listener = (event: Event) => {
    if ((event as CustomEvent<TourEventName>).detail === name) handler();
  };

  window.addEventListener(CHANNEL, listener);
  return () => window.removeEventListener(CHANNEL, listener);
}
