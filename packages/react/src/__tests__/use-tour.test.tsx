import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defineFlow } from "@cairnkit/core";
import type { ReactNode } from "react";
import { CairnProvider } from "../provider/cairn-provider";
import { useTour } from "../hooks/use-tour";
import type { RouterAdapter } from "../adapters/router";

const LIST = "/list";
const FORM = "/form";
const AI = "/ai";

const main = defineFlow({
  id: "main",
  version: 1,
  entryRoute: LIST,
  resumeAt: [{ pathname: FORM, stepIndex: 2 }],
  handoffRoutes: [{ pathname: AI, flowId: "other" }],
  steps: [
    { anchor: "a.one", title: "One", body: "1" },
    { anchor: "a.two", title: "Two", body: "2" },
    { anchor: "a.three", title: "Three", body: "3" },
  ],
});

const other = defineFlow({
  id: "other",
  version: 1,
  entryRoute: AI,
  pauseRoutes: [LIST],
  steps: [{ anchor: "b.one", title: "B", body: "b" }],
});

function makeRouter(pathname: string): RouterAdapter {
  return { usePathname: () => pathname, navigate: vi.fn() };
}

function wrapper(pathname: string) {
  return ({ children }: { children: ReactNode }) => (
    <CairnProvider flows={[main, other]} router={makeRouter(pathname)}>
      {children}
    </CairnProvider>
  );
}

afterEach(() => localStorage.clear());

describe("useTour", () => {
  it("starts a flow and reports the first step", () => {
    const { result } = renderHook(() => useTour(), { wrapper: wrapper(LIST) });
    act(() => result.current.start("main"));

    expect(result.current.flow?.id).toBe("main");
    expect(result.current.stepIndex).toBe(0);
    expect(result.current.step?.title).toBe("One");
  });

  it("advances, goes back, and completes on the last step", () => {
    const { result } = renderHook(() => useTour(), { wrapper: wrapper(LIST) });
    act(() => result.current.start("main"));

    act(() => result.current.advance());
    expect(result.current.stepIndex).toBe(1);

    act(() => result.current.back());
    expect(result.current.stepIndex).toBe(0);

    act(() => { result.current.advance(); });
    act(() => { result.current.advance(); });
    act(() => { result.current.advance() });
    // Past the final step the flow completes and clears itself.
    expect(result.current.flow).toBeNull();
  });

  it("catches up when the user is already ahead of the guide", () => {
    // Same flow, but the app is on the form route while the tour is at step 0.
    const { result } = renderHook(() => useTour(), { wrapper: wrapper(FORM) });
    act(() => result.current.start("main"));
    expect(result.current.stepIndex).toBe(2);
  });

  it("hands off to the guide that owns the route", () => {
    const { result } = renderHook(() => useTour(), { wrapper: wrapper(AI) });
    act(() => result.current.start("main"));
    expect(result.current.flow?.id).toBe("other");
  });

  it("pauses rather than ending on a route it does not cover", () => {
    const { result } = renderHook(() => useTour(), { wrapper: wrapper(LIST) });
    act(() => result.current.start("other"));

    expect(result.current.isPaused).toBe(true);
    // Still active — returning to a covered route resumes the same step.
    expect(result.current.flow?.id).toBe("other");
  });

  it("shows Next only when nothing else can satisfy the step", () => {
    const clicky = defineFlow({
      id: "clicky", version: 1, entryRoute: LIST,
      steps: [{ anchor: "c.one", title: "C", body: "c", advanceOn: { type: "click" } }],
    });

    const { result } = renderHook(() => useTour(), {
      wrapper: ({ children }) => (
        <CairnProvider flows={[clicky]} router={makeRouter(LIST)}>{children}</CairnProvider>
      ),
    });

    act(() => result.current.start("clicky"));
    expect(result.current.showNext).toBe(false);
    expect(result.current.showBeacon).toBe(true);
  });
});
