import { resolveAnchor } from "../anchors/resolve-anchor";
import { onTourEvent } from "../events/emit";
import type { AdvanceRule } from "../flows/types";

export const DEFAULT_ADVANCE: AdvanceRule = { type: "next" };

/** Next is only offered when nothing else can satisfy the step. */
export function showsNextButton(rule: AdvanceRule): boolean {
  return rule.type === "next";
}

export function defaultsToBeacon(rule: AdvanceRule): boolean {
  return rule.type === "click";
}

/**
 * Wires a rule up to whatever satisfies it and returns a teardown.
 *
 * `route` is handled by the caller, which owns the pathname — everything else
 * is a subscription, so they share one shape.
 */
export function bindAdvanceRule(
  rule: AdvanceRule,
  target: HTMLElement | null,
  advance: () => void,
): () => void {
  if (rule.type === "click") {
    if (!target) return () => {};
    target.addEventListener("click", advance);
    return () => target.removeEventListener("click", advance);
  }

  if (rule.type === "event") {
    return onTourEvent(rule.name, advance);
  }

  if (rule.type === "condition") {
    if (resolveAnchor(rule.awaitAnchor)) {
      advance();
      return () => {};
    }

    const observer = new MutationObserver(() => {
      if (!resolveAnchor(rule.awaitAnchor)) return;
      observer.disconnect();
      advance();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }

  return () => {};
}
