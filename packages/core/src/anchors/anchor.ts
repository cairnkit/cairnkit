import { ANCHOR_ATTRIBUTE, type AnchorId } from "./types";

/**
 * Spread onto any element that forwards unknown props:
 *
 *   <button {...anchor(anchors.questions.tabCreate)} />
 *
 * Deliberately the only coupling a product component has to cairnkit.
 */
export function anchor(id: AnchorId): Record<string, string> {
  return { [ANCHOR_ATTRIBUTE]: id };
}

/**
 * Escapes the id before it reaches a selector.
 *
 * Anchor ids are author-controlled, but they also flow in from config and from
 * `?tour=` deep links. An unescaped quote would break out of the attribute
 * selector and match arbitrary elements, so the tour could be pointed at
 * something it was never meant to highlight.
 */
export function anchorSelector(id: AnchorId): string {
  const escaped =
    typeof CSS !== "undefined" && typeof CSS.escape === "function"
      ? CSS.escape(id)
      : String(id).replace(/["\\\]]/g, "\\$&");

  return `[${ANCHOR_ATTRIBUTE}="${escaped}"]`;
}
