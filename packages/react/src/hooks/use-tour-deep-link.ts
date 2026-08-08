"use client";

import { useEffect, useRef } from "react";
import { getFlow } from "@cairnkit/core";
import { useCairn } from "../provider/cairn-context";

/**
 * Starts a flow from `?tour=<flowId>` so support and sales can deep-link
 * someone straight into a guide.
 *
 * Reads `window.location.search` rather than a framework hook on purpose. In
 * Next, `useSearchParams` opts its whole subtree out of prerendering and needs
 * its own Suspense boundary; going through the DOM keeps this working in any
 * framework with no boundary and no adapter surface.
 */
export function useTourDeepLink(param = "tour") {
  const { store, flows } = useCairn();
  // Honour each distinct `?tour=` value exactly once.
  //
  // Keying off "is a tour running" fails in both directions: a stale tour in
  // localStorage would swallow the link, and once the user skips, the param is
  // still in the URL so the effect would restart the tour they just dismissed.
  const honoured = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const requested = new URLSearchParams(window.location.search).get(param);
    if (!requested || !getFlow(flows, requested)) return;
    if (honoured.current === requested) return;

    honoured.current = requested;
    store.start(requested);
  }, [flows, store, param]);
}
