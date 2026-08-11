// `cleanup` is explicit: this suite runs without `globals`, so nothing
// unmounts the previous test's tree and its launcher would still be findable.
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defineFlow } from "@cairnkit/core";
import { CairnProvider, useStartTour, useTour, useTourScope } from "@cairnkit/react";
import type { ReactNode } from "react";
import { TourLauncher } from "../organisms/tour-launcher";

const INVITE = "/invite";

const individual = defineFlow({
  id: "individual",
  version: 1,
  entryRoute: INVITE,
  scope: "individual",
  steps: [{ anchor: "invite.tabs", title: "Tabs", body: "t", onEnter: () => entered() }],
});

const shareable = defineFlow({
  id: "shareable",
  version: 1,
  entryRoute: INVITE,
  scope: "shareable",
  steps: [{ anchor: "invite.tabs", title: "Tabs", body: "t" }],
});

const entered = vi.fn();
const router = { usePathname: () => INVITE, navigate: vi.fn() };

/**
 * The real arrangement: something driving the tour (the overlay does this via
 * `useTour`) with a launcher beside it, both under one provider.
 */
function Page({ tab, offer }: { tab: string; offer: "individual" | "shareable" }) {
  useTourScope(tab);
  useTour();
  return <TourLauncher flowId={offer} label={`Guide: ${offer}`} />;
}

function Harness({ children }: { children: ReactNode }) {
  return (
    <CairnProvider flows={[individual, shareable]} router={router}>
      {children}
    </CairnProvider>
  );
}

/** Starts a flow from outside the tree under test. */
function useStarter() {
  return useStartTour();
}

let start: ReturnType<typeof useStarter>;

function Starter() {
  start = useStarter();
  return null;
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  entered.mockClear();
});

describe("TourLauncher", () => {
  it("offers the guide when nothing is running", () => {
    render(
      <Harness>
        <Starter />
        <Page tab="individual" offer="individual" />
      </Harness>,
    );

    expect(screen.getByLabelText("Guide: individual")).toBeDefined();
  });

  it("gets out of the way while its tour is on screen", () => {
    render(
      <Harness>
        <Starter />
        <Page tab="individual" offer="individual" />
      </Harness>,
    );

    act(() => start("individual"));

    expect(screen.queryByLabelText("Guide: individual")).toBeNull();
  });

  it("offers the other guide once the running one goes dormant", () => {
    const { rerender } = render(
      <Harness>
        <Starter />
        <Page tab="individual" offer="individual" />
      </Harness>,
    );

    act(() => start("individual"));

    // The user switches tab. The individual guide pauses; the shareable tab's
    // launcher is how they reach the guide that covers where they now are.
    rerender(
      <Harness>
        <Starter />
        <Page tab="shareable" offer="shareable" />
      </Harness>,
    );

    expect(screen.getByLabelText("Guide: shareable")).toBeDefined();
  });

  it("will not offer to restart the dormant flow itself", () => {
    const { rerender } = render(
      <Harness>
        <Starter />
        <Page tab="individual" offer="individual" />
      </Harness>,
    );

    act(() => start("individual"));

    // Same paused flow, offered by its own launcher: starting it again would
    // silently throw away the progress it is holding.
    rerender(
      <Harness>
        <Starter />
        <Page tab="shareable" offer="individual" />
      </Harness>,
    );

    expect(screen.queryByLabelText("Guide: individual")).toBeNull();
  });

  it("does not put a second driver on the page", async () => {
    render(
      <Harness>
        <Starter />
        <Page tab="individual" offer="individual" />
      </Harness>,
    );

    act(() => start("individual"));
    await act(async () => {
      await Promise.resolve();
    });

    // Using `useTour` inside the launcher ran every lifecycle hook twice.
    expect(entered).toHaveBeenCalledTimes(1);
  });
});
