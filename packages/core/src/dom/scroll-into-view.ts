export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function scrollAnchorIntoView(element: HTMLElement): void {
  element.scrollIntoView({
    block: "center",
    inline: "nearest",
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
}
