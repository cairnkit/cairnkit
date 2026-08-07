"use client";

import { useEffect } from "react";
import { getFlow } from "@cairnkit/core";
import { useCairn } from "../provider/cairn-context";
import { useTourState } from "./use-cairn-store";

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
  const activeFlowId = useTourState((state) => state.activeFlowId);

  useEffect(() => {
    if (activeFlowId) return;
    if (typeof window === "undefined") return;

    const requested = new URLSearchParams(window.location.search).get(param);
    if (!requested || !getFlow(flows, requested)) return;

    store.start(requested);
  }, [activeFlowId, flows, store, param]);
}
