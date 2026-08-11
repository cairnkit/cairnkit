export function prefersReducedMotion(): boolean {
  // jsdom has no matchMedia. A library must not take down a consumer's test
  // suite over a progressive enhancement — assume full motion and move on.
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function scrollAnchorIntoView(element: HTMLElement): void {
  // Not implemented in jsdom either, and scrolling is the one thing a headless
  // DOM cannot meaningfully do. Same rule: degrade, never throw.
  if (typeof element.scrollIntoView !== "function") return;

  element.scrollIntoView({
    block: "center",
    inline: "nearest",
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
}
