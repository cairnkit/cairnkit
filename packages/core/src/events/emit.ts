import type { RegisteredEvent } from "../register";

const CHANNEL = "cairn:event";

/**
 * Lets a step wait on real work rather than a Next button:
 *
 *   emitTourEvent("question:created");
 *
 * One line at the call site, and the only Cairn import a service needs.
 */
export function emitTourEvent(name: RegisteredEvent): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CHANNEL, { detail: name }));
}

/** Subscribes to a single app event. Returns an unsubscribe function. */
export function onTourEvent(name: RegisteredEvent, handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const listener = (event: Event) => {
    if ((event as CustomEvent<RegisteredEvent>).detail === name) handler();
  };

  window.addEventListener(CHANNEL, listener);
  return () => window.removeEventListener(CHANNEL, listener);
}
