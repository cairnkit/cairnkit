"use client";

import { useEffect, useRef, useState } from "react";
import {
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
 * Resolves an anchor to a live element and tracks its viewport rect.
 *
 * Two behaviours here were bought with real bugs:
 *
 * `statusFor` pairs the status with the anchor it describes. `status` is a
 * render-time value, so right after an optional step advances it still reads
 * "missing" from the *previous* anchor while the step is already the new one.
 * Acting on that cascaded through the rest of the flow.
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
  }>({ status: "resolving", statusFor: null });
  // Bumped when a resolved element leaves the DOM, forcing re-resolution —
  // otherwise the effect never re-runs and the tour waits forever.
  const [attempt, setAttempt] = useState(0);
  const rectRef = useRef<TargetRect | null>(null);

  useEffect(() => {
    if (!enabled || !anchorId) {
      setElement(null);
      setResolution({ status: "resolving", statusFor: null });
      return;
    }

    setResolution({ status: "resolving", statusFor: anchorId });

    return watchForAnchor(anchorId, waitForMs, (result) => {
      if (result.element) {
        setElement(result.element);
        setResolution({ status: "ready", statusFor: anchorId });
      } else {
        setElement(null);
        setResolution({ status: "missing", statusFor: anchorId });
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

    let frame = 0;

    // rAF rather than throttled scroll events: the spotlight has to stay glued
    // to the target through smooth scrolling. State only updates on real moves.
    const tick = () => {
      if (!element.isConnected) {
        setElement(null);
        setResolution({ status: "resolving", statusFor: anchorId });
        setAttempt((value) => value + 1);
        return;
      }

      const next = readRect(element);
      if (!rectsEqual(rectRef.current, next)) {
        rectRef.current = next;
        setRect(next);
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [element, enabled, anchorId]);

  return { element, rect, status: resolution.status, statusFor: resolution.statusFor };
}
