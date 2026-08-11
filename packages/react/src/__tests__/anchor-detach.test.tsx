// `cleanup` is explicit: this suite runs without `globals`, so nothing unmounts
// the previous test's tree. Its anchor watchers keep their timers, and a 4s one
// firing after teardown reaches for a `window` that no longer exists.
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useAnchorTarget } from "../hooks/use-anchor-target";

/**
 * An element that resolved and then left is not the same event as one that
 * never arrived, and must not cost the same wait.
 *
 * Real timers throughout: the behaviour under test is the interplay of a
 * MutationObserver, a rAF loop and a setTimeout, and faking any one of them
 * tests the fake instead of the code. The numbers below are chosen so the
 * whole file runs in about a second.
 */

/** jsdom gives every element a zero rect, which `resolveAnchor` reads as hidden. */
function mountAnchor(id: string) {
  const element = document.createElement("div");
  element.setAttribute("data-cairn", id);
  element.getBoundingClientRect = () =>
    ({ width: 120, height: 40, top: 0, left: 0, right: 120, bottom: 40, x: 0, y: 0 }) as DOMRect;
  element.scrollIntoView = () => {};
  document.body.appendChild(element);
  return element;
}

const FULL_WAIT = 4000;
const GRACE = 400;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

describe("an anchor that leaves the DOM", () => {
  it("survives a re-mount inside the grace window", async () => {
    mountAnchor("panel");

    const { result } = renderHook(() =>
      useAnchorTarget("panel", { waitForMs: FULL_WAIT, resetKey: "/invite" }),
    );
    await waitFor(() => expect(result.current.status).toBe("ready"));

    // A changed key, a reordered list, a parent recreating the node: the
    // element goes and comes straight back.
    await act(async () => {
      document.body.innerHTML = "";
      await wait(50);
      mountAnchor("panel");
      await wait(50);
    });

    await waitFor(() => expect(result.current.status).toBe("ready"));
  });

  it("reports a real departure in the grace window, not the full wait", async () => {
    mountAnchor("panel");

    const { result } = renderHook(() =>
      useAnchorTarget("panel", { waitForMs: FULL_WAIT, resetKey: "/invite" }),
    );
    await waitFor(() => expect(result.current.status).toBe("ready"));

    const left = Date.now();
    await act(async () => {
      document.body.innerHTML = "";
    });

    await waitFor(() => expect(result.current.status).toBe("missing"), { timeout: 2000 });

    // The point of the change: four seconds of a frozen guide became a
    // fraction of one. Generous upper bound so a slow CI box cannot flake it.
    expect(Date.now() - left).toBeLessThan(FULL_WAIT / 2);
  });

  it("keeps the full wait when the departure was a navigation", async () => {
    mountAnchor("panel");

    const { result, rerender } = renderHook(
      ({ route }) => useAnchorTarget("panel", { waitForMs: FULL_WAIT, resetKey: route }),
      { initialProps: { route: "/invite" } },
    );
    await waitFor(() => expect(result.current.status).toBe("ready"));

    // A route transition tears the old page out before the new one commits.
    // Cutting that short is the regression this guards.
    await act(async () => {
      document.body.innerHTML = "";
      rerender({ route: "/invite/questions" });
      await wait(GRACE + 250);
    });

    expect(result.current.status).toBe("resolving");
  });

  it("never graces longer than the caller asked to wait", async () => {
    mountAnchor("panel");

    const { result } = renderHook(() =>
      // A step that declared a short wait must not be given a longer one just
      // because its element had resolved once.
      useAnchorTarget("panel", { waitForMs: 100, resetKey: "/invite" }),
    );
    await waitFor(() => expect(result.current.status).toBe("ready"));

    const left = Date.now();
    await act(async () => {
      document.body.innerHTML = "";
    });

    await waitFor(() => expect(result.current.status).toBe("missing"), { timeout: 1000 });
    expect(Date.now() - left).toBeLessThan(GRACE);
  });
});
