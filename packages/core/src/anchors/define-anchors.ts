import type { AnchorLeaves } from "./types";

/**
 * Declares the anchors a product exposes to its guides.
 *
 * Identity at runtime — its whole job is inferring a literal-typed shape so
 * flows reference `anchors.questions.tabCreate` and a rename fails to compile
 * at the flow definition rather than silently at runtime.
 */
export function defineAnchors<const T extends Record<string, unknown>>(registry: T): T {
  return registry;
}

export type AnchorsOf<T> = AnchorLeaves<T>;
