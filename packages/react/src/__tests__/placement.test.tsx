import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defineFlow } from "@cairnkit/core";
import type { ReactNode } from "react";
import { CairnProvider } from "../provider/cairn-provider";
import { useActiveTour } from "../hooks/use-active-tour";
import { useTour } from "../hooks/use-tour";
import { useTourScope } from "../hooks/use-tour-scope";
import { useTourState } from "../hooks/use-cairn-store";
import type { RouterAdapter } from "../adapters/router";

const INVITE = "/invite";

/**
 * The shape that broke in the wild: two guides, one URL, told apart only by a
 * tab. Both anchor their first step at the tab strip, which never unmounts —
 * so nothing in the DOM distinguishes them.
 */
const individual = defineFlow({
  id: "individual",
  version: 1,
  entryRoute: INVITE,
  scope: "individual",
  steps: [
    { anchor: "invite.tabs", title: "Tabs", body: "t" },
    { anchor: "invite.send", title: "Send", body: "s" },
  ],
});

const shareable = defineFlow({
  id: "shareable",
  version: 1,
  entryRoute: INVITE,
  scope: "shareable",
  steps: [{ anchor: "invite.tabs", title: "Tabs", body: "t" }],
});

/** No scope at all — the pre-existing shape, which must keep behaving as it did. */
const unscoped = defineFlow({
  id: "unscoped",
  version: 1,
  entryRoute: INVITE,
  steps: [{ anchor: "invite.tabs", title: "Tabs", body: "t" }],
});

const router: RouterAdapter = { usePathname: () => INVITE, navigate: vi.fn() };

function wrapper({ children }: { children: ReactNode }) {
  return (
    <CairnProvider flows={[individual, shareable, unscoped]} router={router}>
      {children}
    </CairnProvider>
  );
}

/** Drives a tour while the app declares which tab is in front. */
function useTourInTab(tab: string) {
  useTourScope(tab);
  return useTour();
}

afterEach(() => localStorage.clear());

describe("scope", () => {
  it("goes dormant when the app moves to another part of the screen", () => {
    const { result, rerender } = renderHook(({ tab }) => useTourInTab(tab), {
      wrapper,
      initialProps: { tab: "individual" },
    });

    act(() => result.current.start("individual"));
    act(() => result.current.advance());
    expect(result.current.isPaused).toBe(false);
    expect(result.current.stepIndex).toBe(1);

    rerender({ tab: "shareable" });

    expect(result.current.isPaused).toBe(true);
    // Dormant, not over: the flow is still the active one.
    expect(result.current.flow?.id).toBe("individual");
  });

  it("resumes on the step it left when the user comes back", () => {
    const { result, rerender } = renderHook(({ tab }) => useTourInTab(tab), {
      wrapper,
      initialProps: { tab: "individual" },
    });

    act(() => result.current.start("individual"));
    act(() => result.current.advance());

    rerender({ tab: "shareable" });
    rerender({ tab: "individual" });

    expect(result.current.isPaused).toBe(false);
    expect(result.current.stepIndex).toBe(1);
  });

  it("leaves a flow without a scope alone", () => {
    const { result, rerender } = renderHook(({ tab }) => useTourInTab(tab), {
      wrapper,
      initialProps: { tab: "individual" },
    });

    act(() => result.current.start("unscoped"));
    rerender({ tab: "shareable" });

    // Opting out has to mean opting out, or this is a breaking change for
    // every flow written before scope existed.
    expect(result.current.isPaused).toBe(false);
  });

  it("imposes nothing when the app never declares a scope", () => {
    const { result } = renderHook(() => useTour(), { wrapper });

    act(() => result.current.start("individual"));

    // A scoped flow in an app that has not adopted scope must still run.
    expect(result.current.isPaused).toBe(false);
    expect(result.current.flow?.id).toBe("individual");
  });

  it("does not confuse two flows that share an anchor", () => {
    const { result, rerender } = renderHook(({ tab }) => useTourInTab(tab), {
      wrapper,
      initialProps: { tab: "individual" },
    });

    act(() => result.current.start("individual"));
    rerender({ tab: "shareable" });

    // `invite.tabs` is on screen in both tabs, so anchor presence says the
    // step is fine. Scope is what knows better.
    expect(result.current.step?.anchor).toBe("invite.tabs");
    expect(result.current.isPaused).toBe(true);
  });
});

describe("exit bookkeeping", () => {
  it("records a dismissal when the user skips", () => {
    const { result } = renderHook(
      () => ({ tour: useTour(), dismissed: useTourState((s) => s.dismissedFlows) }),
      { wrapper },
    );

    act(() => result.current.tour.start("individual"));
    act(() => result.current.tour.skip());

    expect(result.current.dismissed).toEqual({ individual: 1 });
  });

  it("records nothing when the app pulls the anchor out from under a step", async () => {
    const onNotice = vi.fn();

    const { result } = renderHook(
      () => ({ tour: useTour(), dismissed: useTourState((s) => s.dismissedFlows) }),
      {
        wrapper: ({ children }) => (
          <CairnProvider
            flows={[
              defineFlow({
                id: "individual",
                version: 1,
                entryRoute: INVITE,
                // Nothing in the DOM: the anchor cannot resolve.
                steps: [{ anchor: "gone", title: "Gone", body: "g", waitForMs: 10 }],
              }),
            ]}
            router={router}
            onNotice={onNotice}
          >
            {children}
          </CairnProvider>
        ),
      },
    );

    act(() => result.current.tour.start("individual"));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 40));
    });

    expect(onNotice).toHaveBeenCalledWith(expect.objectContaining({ reason: "anchor-missing" }));
    expect(result.current.tour.flow).toBeNull();
    // The user never dismissed anything — the app moved.
    expect(result.current.dismissed).toEqual({});
  });
});

describe("leaving the page a step lives on", () => {
  const LIST = "/questions";
  const FORM = "/questions/new";

  /** Steps 0–1 belong to the list; step 2 belongs to the form. */
  const crossing = defineFlow({
    id: "individual",
    version: 1,
    entryRoute: LIST,
    steps: [
      { anchor: "list.tabs", title: "Tabs", body: "t", waitForMs: 20 },
      { anchor: "list.cta", title: "Open it", body: "o", waitForMs: 20 },
      { anchor: "form.title", title: "Name it", body: "n", waitForMs: 20 },
    ],
  });

  /** The pathname the adapter reports. Reassign, then rerender. */
  let at = LIST;

  const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 60))));

  function mount(onNotice?: (n: unknown) => void) {
    return renderHook(() => useTour(), {
      wrapper: ({ children }) => (
        <CairnProvider
          flows={[crossing]}
          router={{ usePathname: () => at, navigate: vi.fn() }}
          onNotice={onNotice as never}
        >
          {children}
        </CairnProvider>
      ),
    });
  }

  it("goes dormant instead of ending", async () => {
    at = FORM;
    const onNotice = vi.fn();
    const { result, rerender } = mount(onNotice);

    act(() => result.current.start("individual"));
    act(() => result.current.advance());
    act(() => result.current.advance());
    expect(result.current.stepIndex).toBe(2);

    // Browser Back. Step 2 is anchored on the form, which is no longer here.
    at = LIST;
    rerender();
    await settle();

    expect(result.current.isPaused).toBe(true);
    // Dormant, not over — the flow and the step both survive the trip.
    expect(result.current.flow?.id).toBe("individual");
    expect(result.current.stepIndex).toBe(2);
    expect(onNotice).not.toHaveBeenCalledWith(
      expect.objectContaining({ reason: "anchor-missing" }),
    );
  });

  it("still ends when the element is gone from the page it lives on", async () => {
    at = LIST;
    const onNotice = vi.fn();
    const { result } = mount(onNotice);

    act(() => result.current.start("individual"));
    await settle();

    // Never navigated, and the anchor never arrived: a real fault, not a trip.
    expect(onNotice).toHaveBeenCalledWith(expect.objectContaining({ reason: "anchor-missing" }));
    expect(result.current.flow).toBeNull();
  });

  it("hides Back when the previous step is not reachable from here", () => {
    at = LIST;
    const { result } = mount();

    act(() => result.current.start("individual"));
    act(() => result.current.advance());

    // No DOM in this suite, so the previous anchor cannot resolve — the same
    // position the user is in after navigating away from it. Back would either
    // stall or, with a `resumeAt` for this route, be undone instantly.
    expect(result.current.showBack).toBe(false);
  });

  it("keeps Back when the previous step can restore itself", () => {
    at = LIST;
    const withHook = defineFlow({
      id: "individual",
      version: 1,
      entryRoute: LIST,
      steps: [
        // `onEnter` reopens the modal this step is anchored inside, so the
        // anchor being absent right now proves nothing about going back to it.
        { anchor: "modal.field", title: "In a modal", body: "m", onEnter: () => {} },
        { anchor: "page.next", title: "After", body: "a", waitForMs: 20 },
      ],
    });

    const { result } = renderHook(() => useTour(), {
      wrapper: ({ children }) => (
        <CairnProvider flows={[withHook]} router={{ usePathname: () => at, navigate: vi.fn() }}>
          {children}
        </CairnProvider>
      ),
    });

    act(() => result.current.start("individual"));
    act(() => result.current.advance());

    expect(result.current.showBack).toBe(true);
  });
});

describe("analytics", () => {
  it("reports each step viewed once, however often it re-renders", async () => {
    const onEvent = vi.fn();
    const { result, rerender } = renderHook(({ tab }) => useTourInTab(tab), {
      wrapper: ({ children }) => (
        <CairnProvider flows={[individual, shareable]} router={router} onEvent={onEvent}>
          {children}
        </CairnProvider>
      ),
      initialProps: { tab: "individual" },
    });

    act(() => result.current.start("individual"));

    // Going dormant and waking is the case that double-counted.
    rerender({ tab: "shareable" });
    rerender({ tab: "individual" });
    rerender({ tab: "individual" });

    const views = onEvent.mock.calls
      .map(([event]) => event)
      .filter((event) => event.name === "step_viewed");

    expect(views).toHaveLength(1);
    expect(views[0].props.stepIndex).toBe(0);
  });
});

describe("useActiveTour", () => {
  it("reads the tour without driving it", async () => {
    const entered = vi.fn();
    const flow = defineFlow({
      id: "unscoped",
      version: 1,
      entryRoute: INVITE,
      steps: [{ anchor: "invite.tabs", title: "T", body: "t", onEnter: entered }],
    });

    // The real arrangement: an overlay driving the tour, and a launcher beside
    // it that only looks. A second `useTour` here fired every hook twice.
    const { result } = renderHook(() => ({ driver: useTour(), observer: useActiveTour() }), {
      wrapper: ({ children }) => (
        <CairnProvider flows={[flow]} router={router}>
          {children}
        </CairnProvider>
      ),
    });

    act(() => result.current.driver.start("unscoped"));
    // `onEnter` is deferred to a microtask so a throwing hook cannot take the
    // render down with it.
    await act(async () => {
      await Promise.resolve();
    });

    expect(entered).toHaveBeenCalledTimes(1);
    expect(result.current.observer.flow?.id).toBe("unscoped");
  });
});
