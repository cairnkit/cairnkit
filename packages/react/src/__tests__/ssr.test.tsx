/**
 * Runs in Node, not jsdom: no `window`, no `document`.
 *
 * Every other test file gets a DOM for free, which makes it impossible to
 * catch the class of bug where something reads `document` during render. That
 * bug is invisible in development and fatal in production, so it gets its own
 * environment.
 *
 * @vitest-environment node
 */
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { defineFlow } from "@cairnkit/core";
import type { RouterAdapter } from "../adapters/router";
import { CairnProvider } from "../provider/cairn-provider";
import { useTour } from "../hooks/use-tour";

const router: RouterAdapter = { usePathname: () => "/", navigate: () => {} };

function Probe() {
  const tour = useTour();
  return <div data-testid="probe">{`${tour.stepIndex}:${String(tour.isPaused)}`}</div>;
}

function render(flows: Parameters<typeof CairnProvider>[0]["flows"]) {
  return renderToString(
    <CairnProvider flows={flows} router={router}>
      <Probe />
    </CairnProvider>,
  );
}

describe("server rendering", () => {
  it("has no DOM available", () => {
    expect(typeof window).toBe("undefined");
    expect(typeof document).toBe("undefined");
  });

  it("renders a provider and a consumer without touching the DOM", () => {
    const flow = defineFlow({
      id: "main",
      version: 1,
      entryRoute: "/",
      steps: [{ anchor: "a.one", title: "One", body: "1" }],
    });

    expect(render([flow])).toContain("0:false");
  });

  it("does not run step lifecycle hooks on the server", () => {
    const fired: string[] = [];
    const flow = defineFlow({
      id: "main",
      version: 1,
      entryRoute: "/",
      steps: [
        {
          anchor: "a.one",
          title: "One",
          body: "1",
          onEnter: () => { fired.push("enter"); },
          onExit: () => { fired.push("exit"); },
        },
      ],
    });

    render([flow]);

    // `onEnter` lives in an effect, and effects do not run during
    // renderToString. A hook that closes a modal must never fire server-side.
    expect(fired).toEqual([]);
  });
});
