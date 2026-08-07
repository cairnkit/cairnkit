import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useOverlayContainer } from "../lib/use-overlay-container";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("useOverlayContainer", () => {
  it("mounts on body for an ordinary page target", () => {
    const target = document.createElement("button");
    document.body.appendChild(target);

    const { result } = renderHook(() => useOverlayContainer(target));
    expect(result.current?.parentElement).toBe(document.body);
  });

  it("mounts inside the dialog when the target lives in one", () => {
    // The case that matters: a dialog's focus trap and `inert` would make an
    // overlay mounted on body unreachable and unclickable.
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    const target = document.createElement("input");
    dialog.appendChild(target);
    document.body.appendChild(dialog);

    const { result } = renderHook(() => useOverlayContainer(target));
    expect(result.current?.parentElement).toBe(dialog);
  });

  it("strips inert if a dialog library marks our container after mount", () => {
    const target = document.createElement("button");
    document.body.appendChild(target);

    const { result } = renderHook(() => useOverlayContainer(target));
    const node = result.current!;

    node.setAttribute("inert", "");
    // MutationObserver callbacks are microtask-scheduled.
    return Promise.resolve().then(() => {
      expect(node.hasAttribute("inert")).toBe(false);
    });
  });

  it("removes its container on unmount", () => {
    const target = document.createElement("button");
    document.body.appendChild(target);

    const { result, unmount } = renderHook(() => useOverlayContainer(target));
    const node = result.current!;
    expect(node.isConnected).toBe(true);

    unmount();
    expect(node.isConnected).toBe(false);
  });
});
