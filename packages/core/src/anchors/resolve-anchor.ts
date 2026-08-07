import { devWarn } from "../internal/dev";
import { anchorSelector } from "./anchor";
import type { AnchorId } from "./types";

function isVisible(element: HTMLElement): boolean {
  if (!element.isConnected) return false;
  const box = element.getBoundingClientRect();
  return box.width > 0 && box.height > 0;
}

/**
 * Resolves an anchor to the element the user can actually see.
 *
 * Responsive shells legitimately render the same anchor twice — a desktop
 * sidebar stays mounted but hidden at mobile widths, and vice versa. A bare
 * querySelector would return a 0x0 element and spotlight nothing, so visible
 * matches win. This is what lets one anchor id work across breakpoints.
 */
export function resolveAnchor(id: AnchorId, doc?: Document): HTMLElement | null {
  // Resolved inside the body, not as a default parameter: `doc = document`
  // evaluates before any guard can run, so it throws a ReferenceError during
  // server rendering rather than returning null.
  const target = doc ?? (typeof document !== "undefined" ? document : null);
  if (!target) return null;

  const matches = Array.from(target.querySelectorAll<HTMLElement>(anchorSelector(id)));
  const visible = matches.filter(isVisible);

  if (visible.length > 1) {
    devWarn(`anchor "${id}" matched ${visible.length} visible elements; expected 1.`);
  }

  return visible[0] ?? null;
}
