"use client";

import { useEffect, useRef, useState } from "react";
import type { TargetRect } from "@cairnkit/core";
import { cx } from "../lib/cx";

const DEFAULT_PADDING = 8;

/**
 * How long the previous cutout is held while the next target resolves. Long
 * enough that a normal step change morphs smoothly; short enough that a target
 * which never arrives does not leave a bright hole over unrelated content.
 */
const STALE_GRACE_MS = 300;

export type SpotlightProps = {
  rect: TargetRect | null;
  /** Changes when the tour moves to a different target. */
  anchorKey?: string | null;
  padding?: number;
  beacon?: boolean;
  /**
   * Top-left of the positioning root in viewport space. Non-zero only when the
   * overlay is portaled inside a dialog whose ancestor established a
   * containing block for fixed elements.
   */
  origin?: { x: number; y: number };
};

export function Spotlight({
  rect,
  anchorKey,
  padding = DEFAULT_PADDING,
  beacon,
  origin = { x: 0, y: 0 },
}: SpotlightProps) {
  const [shown, setShown] = useState<TargetRect | null>(rect);
  const positioned = useRef(false);

  useEffect(() => {
    if (rect) setShown(rect);
  }, [rect]);

  useEffect(() => {
    if (rect) return;
    const timer = window.setTimeout(() => {
      setShown(null);
      positioned.current = false;
    }, STALE_GRACE_MS);
    return () => window.clearTimeout(timer);
  }, [rect, anchorKey]);

  useEffect(() => {
    if (shown) positioned.current = true;
  }, [shown]);

  // Nothing resolved yet — plain scrim, so there is no cutout in the wrong place.
  if (!shown) return <div className="cairn-spotlight--flat" aria-hidden />;

  const geometry = {
    top: shown.top - origin.y - padding,
    left: shown.left - origin.x - padding,
    width: shown.width + padding * 2,
    height: shown.height + padding * 2,
    borderRadius: Math.max(shown.radius, 6) + padding / 2,
  };

  const moves = positioned.current;

  return (
    <div aria-hidden>
      <div className={cx("cairn-spotlight", moves && "cairn-spotlight--moves")} style={geometry} />
      <div className={cx("cairn-halo", moves && "cairn-halo--moves")} style={geometry} />
      {beacon && (
        <div
          className="cairn-beacon"
          style={{ top: geometry.top - 5, left: geometry.left + geometry.width - 5 }}
        >
          <span />
          <span />
        </div>
      )}
    </div>
  );
}
