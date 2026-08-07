/** A registry leaf — the string written into `data-cairn`. */
export type AnchorId = string & { readonly __cairnAnchor?: unique symbol };

/** Recursively unions the string leaves of an anchor registry. */
export type AnchorLeaves<T> = T extends string
  ? T
  : { [K in keyof T]: AnchorLeaves<T[K]> }[keyof T];

export const ANCHOR_ATTRIBUTE = "data-cairn";

/**
 * Marks a wrapper that carries an anchor on behalf of its child.
 * `<TourAnchor>` uses `display: contents`, which leaves the wrapper with no
 * box of its own — so the resolver measures the child instead.
 */
export const ANCHOR_PASSTHROUGH = "data-cairn-passthrough";
