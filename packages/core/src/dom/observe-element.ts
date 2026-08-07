import { resolveAnchor } from "../anchors/resolve-anchor";
import type { AnchorId } from "../anchors/types";

export type WatchResult = { element: HTMLElement } | { element: null; timedOut: true };

/**
 * Waits for an anchor that may not exist yet — route still transitioning, tab
 * panel unmounted, data still loading — giving up after `timeoutMs`.
 *
 * The caller decides what a timeout means: an optional step skips, a required
 * one ends the tour.
 */
export function watchForAnchor(
  id: AnchorId,
  timeoutMs: number,
  onResult: (result: WatchResult) => void,
): () => void {
  const immediate = resolveAnchor(id);
  if (immediate) {
    onResult({ element: immediate });
    return () => {};
  }

  let settled = false;

  const observer = new MutationObserver(() => {
    const found = resolveAnchor(id);
    if (!found) return;
    settled = true;
    observer.disconnect();
    clearTimeout(timer);
    onResult({ element: found });
  });

  observer.observe(document.body, { childList: true, subtree: true });

  const timer = setTimeout(() => {
    if (settled) return;
    observer.disconnect();
    onResult({ element: null, timedOut: true });
  }, timeoutMs);

  return () => {
    observer.disconnect();
    clearTimeout(timer);
  };
}
