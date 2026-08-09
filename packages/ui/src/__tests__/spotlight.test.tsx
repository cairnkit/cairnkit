/**
 * The spotlight is positioned absolutely inside `.cairn-root`, which is
 * `position: fixed; inset: 0`. That equals the viewport — until the overlay
 * portals into a dialog whose ancestor has `transform`, `filter`,
 * `backdrop-filter`, `perspective`, `contain` or `will-change`. Any of those
 * becomes the containing block for fixed descendants, the root shrinks to it,
 * and viewport coordinates land in the wrong place.
 *
 * Drawers hit this every time: sliding one in means transforming it.
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Spotlight } from "../organisms/spotlight";

const rect = { top: 400, left: 300, width: 200, height: 40, radius: 8 };

function geometryOf(container: HTMLElement) {
  const node = container.querySelector<HTMLElement>(".cairn-spotlight");
  if (!node) throw new Error("spotlight did not render");
  return { top: node.style.top, left: node.style.left };
}

describe("spotlight positioning", () => {
  it("uses viewport coordinates when the root is the viewport", () => {
    const { container } = render(<Spotlight rect={rect} padding={8} />);
    expect(geometryOf(container)).toEqual({ top: "392px", left: "292px" });
  });

  it("subtracts the root origin when portaled into a transformed ancestor", () => {
    // A drawer at x=120, y=60 with its own containing block.
    const { container } = render(
      <Spotlight rect={rect} padding={8} origin={{ x: 120, y: 60 }} />,
    );

    // Without this the ring would sit 120px right and 60px below the target,
    // which is exactly the bug: highlighting empty space behind the dialog.
    expect(geometryOf(container)).toEqual({ top: "332px", left: "172px" });
  });

  it("treats a zero origin as no offset", () => {
    const { container } = render(<Spotlight rect={rect} padding={8} origin={{ x: 0, y: 0 }} />);
    expect(geometryOf(container)).toEqual({ top: "392px", left: "292px" });
  });
});
