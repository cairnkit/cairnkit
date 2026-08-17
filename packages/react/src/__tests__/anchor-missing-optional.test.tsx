// `cleanup` is explicit for the same reason as the other suites here: without
// `globals` nothing unmounts the previous tree, and an anchor watcher's timer
// firing after teardown reaches for a `window` that has gone.
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defineFlow } from "@cairnkit/core";
import type { CairnEvent } from "@cairnkit/core";
import type { ReactNode } from "react";
import { CairnProvider } from "../provider/cairn-provider";
import { useTour } from "../hooks/use-tour";
import type { RouterAdapter } from "../adapters/router";

const HOME = "/home";

/**
 * Neither anchor is ever put in the DOM, so both steps time out. The point of
 * the pair is the difference in what gets reported: the same absence is a fault
 * for one and expected for the other.
 *
 * `waitForMs` is short so the suite does not sit through the 4s default twice.
 */
const flow = defineFlow({
  id: "main",
  version: 1,
  entryRoute: HOME,
  steps: [
    { anchor: "a.optional", title: "Optional", body: "o", optional: true, waitForMs: 20 },
    { anchor: "a.required", title: "Required", body: "r", waitForMs: 20 },
  ],
});

const router: RouterAdapter = { usePathname: () => HOME, navigate: vi.fn() };

function setup(onEvent: (event: CairnEvent) => void) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <CairnProvider flows={[flow]} router={router} onEvent={onEvent}>
      {children}
    </CairnProvider>
  );
  return renderHook(() => useTour(), { wrapper });
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("anchor_missing on an optional step", () => {
  it("flags the optional skip and leaves the required failure unflagged", async () => {
    const events: CairnEvent[] = [];
    const { result } = setup((event) => events.push(event));

    act(() => result.current.start("main"));

    // Step 0 skips, step 1 then fails for real and ends the tour.
    await waitFor(() => expect(result.current.flow).toBeNull(), { timeout: 2000 });

    const missing = events.filter((event) => event.name === "anchor_missing");
    expect(missing).toHaveLength(2);

    // `!` because `noUncheckedIndexedAccess` widens both to `| undefined`, and
    // the length assertion above has already ruled that out.
    const pair = missing as Extract<CairnEvent, { name: "anchor_missing" }>[];
    const optional = pair[0]!;
    const required = pair[1]!;

    expect(optional.props.anchor).toBe("a.optional");
    expect(optional.props.optional).toBe(true);

    /*
     * Absent, not `false`. A consumer filtering on this looks for a truthy flag,
     * and history recorded before the flag existed has to keep counting as
     * breakage rather than becoming ambiguous.
     */
    expect(required.props.anchor).toBe("a.required");
    expect(required.props.optional).toBeUndefined();
    expect("optional" in required.props).toBe(false);
  });
});
