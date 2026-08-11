"use client";

import { useEffect, useRef, useState } from "react";
import {
  readRadius,
  readRect,
  rectsEqual,
  scrollAnchorIntoView,
  watchForAnchor,
  type AnchorId,
  type TargetRect,
} from "@cairnkit/core";

export type AnchorStatus = "resolving" | "ready" | "missing";

const DEFAULT_WAIT_MS = 4000;

/**
 * How long a resolved element has to come back after leaving the DOM.
 *
 * An element that was here and left is not the same event as one that never
 * arrived, and should not cost the same wait. Legitimate re-mounts — a changed
 * key, a reordered list, a parent recreating the node — land in the next
 * commit, so this only needs to outlast a frame by a wide margin. A panel that
 * unmounted for good is then reported in 400ms instead of four seconds of a
 * guide that looks frozen.
 *
 * Navigation is deliberately excluded: it changes `resetKey`, and a route
 * transition keeps the full `waitForMs` it has always had.
 */
const DETACH_GRACE_MS = 400;

/**
 * Resolves an anchor to a live element and tracks its viewport rect.
 *
 * Two behaviours here were bought with real bugs:
 *
 * `statusFor` and `statusAt` pair the status with the anchor *and* the reset
 * key it describes. `status` is a render-time value that outlives what
 * produced it: right after an optional step advances it still reads "missing"
 * from the previous anchor, and for one render after a navigation it still
 * reads "missing" from the previous route. A caller acting on either sees a
 * step fail that is in fact fine, so both are reported alongside it.
 *
 * `resetKey` carries the pathname. A navigation tears the anchor out of the
 * DOM before the new route commits, so without restarting the clock a slow
 * transition trips the missing-anchor timeout mid-navigation.
 */
export function useAnchorTarget(
  anchorId: AnchorId | null,
  options: { waitForMs?: number; enabled?: boolean; resetKey?: string } = {},
) {
  const { waitForMs = DEFAULT_WAIT_MS, enabled = true, resetKey } = options;

  const [element, setElement] = useState<HTMLElement | null>(null);
  const [rect, setRect] = useState<TargetRect | null>(null);
  const [resolution, setResolution] = useState<{
    status: AnchorStatus;
    statusFor: AnchorId | null;
    statusAt: string | null;
  }>({ status: "resolving", statusFor: null, statusAt: null });
  // Bumped when a resolved element leaves the DOM, forcing re-resolution —
  // otherwise the effect never re-runs and the tour waits forever.
  const [attempt, setAttempt] = useState(0);
  const rectRef = useRef<TargetRect | null>(null);

  // The `resetKey` this element was resolved under, recorded when it leaves.
  // Re-resolving under the same key is a re-mount and gets the short grace; a
  // different one means we navigated in between, which is the slow case the
  // full wait exists for.
  const detachedUnder = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !anchorId) {
      setElement(null);
      setResolution({ status: "resolving", statusFor: null, statusAt: null });
      return;
    }

    // Every status this round produces is stamped with the key it was
    // measured under, so a caller can tell a stale reading from a live one.
    const key = resetKey ?? "";

    setResolution({ status: "resolving", statusFor: anchorId, statusAt: key });

    // Never grace *longer* than the caller asked to wait in the first place.
    const timeout =
      detachedUnder.current === key ? Math.min(DETACH_GRACE_MS, waitForMs) : waitForMs;

    return watchForAnchor(anchorId, timeout, (result) => {
      if (result.element) {
        detachedUnder.current = null;
        setElement(result.element);
        setResolution({ status: "ready", statusFor: anchorId, statusAt: key });
      } else {
        setElement(null);
        setResolution({ status: "missing", statusFor: anchorId, statusAt: key });
      }
    });
  }, [anchorId, enabled, waitForMs, attempt, resetKey]);

  useEffect(() => {
    if (!element || !enabled) {
      rectRef.current = null;
      setRect(null);
      return;
    }

    scrollAnchorIntoView(element);

    // Constant for the life of this step; re-read only if the element changes.
    const radius = readRadius(element);

    let frame = 0;

    // rAF rather than throttled scroll events: the spotlight has to stay glued
    // to the target through smooth scrolling. State only updates on real moves.
    const tick = () => {
      if (!element.isConnected) {
        // Deliberately the `resetKey` this effect closed over — the one the
        // element was resolved under, not whatever it is now. That is the
        // whole comparison: same key means a re-mount, a changed one means a
        // navigation happened in between. See the deps note below.
        detachedUnder.current = resetKey ?? "";
        setElement(null);
        setResolution({ status: "resolving", statusFor: anchorId, statusAt: resetKey ?? "" });
        setAttempt((value) => value + 1);
        return;
      }

      const next = readRect(element, radius);
      if (!rectsEqual(rectRef.current, next)) {
        rectRef.current = next;
        setRect(next);
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // `resetKey` is read inside and is not a dependency, on purpose: this
    // effect must keep the value the element resolved under. Adding it would
    // make every detach look like a re-mount and restart the scroll as well.
  }, [element, enabled, anchorId]);

  return {
    element,
    rect,
    status: resolution.status,
    statusFor: resolution.statusFor,
    statusAt: resolution.statusAt,
  };
}
