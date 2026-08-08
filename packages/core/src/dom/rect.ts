export type TargetRect = {
  top: number;
  left: number;
  width: number;
  height: number;
  radius: number;
};

/**
 * Reads the corner radius once, when the target resolves.
 *
 * `getComputedStyle` forces a style resolve and roughly doubles the cost of a
 * rect read (measured 1.22µs → 2.47µs). That is still only 0.015% of a frame,
 * so this is not fixing a bottleneck — but a value that cannot change mid-step
 * has no business being read sixty times a second.
 */
export function readRadius(element: HTMLElement): number {
  return Number.parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0;
}

export function readRect(element: HTMLElement, radius = 0): TargetRect {
  const box = element.getBoundingClientRect();

  return { top: box.top, left: box.left, width: box.width, height: box.height, radius };
}

/** Sub-pixel tolerance keeps a scroll from re-rendering on every frame. */
export function rectsEqual(a: TargetRect | null, b: TargetRect | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;

  return (
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5 &&
    a.radius === b.radius
  );
}
