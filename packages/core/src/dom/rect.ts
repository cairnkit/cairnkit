export type TargetRect = {
  top: number;
  left: number;
  width: number;
  height: number;
  radius: number;
};

export function readRect(element: HTMLElement): TargetRect {
  const box = element.getBoundingClientRect();
  const radius = Number.parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0;

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
