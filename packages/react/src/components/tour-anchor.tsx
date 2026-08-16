"use client";

import type { ReactNode } from "react";
import { ANCHOR_PASSTHROUGH, anchor, type RegisteredAnchor } from "@cairnkit/core";

export type TourAnchorProps = {
  id: RegisteredAnchor;
  children: ReactNode;
};

/**
 * Anchors a component that does not forward unknown props.
 *
 * `{...anchor(id)}` is the normal route and works on anything that spreads its
 * props onto a DOM node. Plenty of components do not — third-party ones you
 * cannot edit, and design-system components that accept only a fixed set. The
 * attribute silently vanishes there, and `cairnkit check` still passes, because
 * the anchor *is* referenced in source. That failure surfaces only in a
 * browser, which is the worst place to find it.
 *
 * The wrapper uses `display: contents`, so it adds no box and cannot disturb
 * flex or grid layout. Having no box also means nothing to measure, which is
 * why it is marked as a pass-through and the resolver measures the child.
 */
export function TourAnchor({ id, children }: TourAnchorProps) {
  return (
    <span {...anchor(id)} {...{ [ANCHOR_PASSTHROUGH]: "" }} style={{ display: "contents" }}>
      {children}
    </span>
  );
}
