"use client";

import { useEffect } from "react";
import { useCairn } from "../provider/cairn-context";

/**
 * Declares which part of the screen is in front.
 *
 * A pathname cannot describe a tabbed page: two guides live at one URL, and
 * switching tabs is invisible to the router. Call this from whichever
 * component owns that state and a flow carrying a matching `scope` knows when
 * it is being looked at:
 *
 *   useTourScope(activeTab);
 *
 * A flow whose scope is not in front goes dormant rather than ending — the
 * same treatment `pauseRoutes` gives a route it does not cover — so coming
 * back picks up on the step you left.
 *
 * Only declare a scope where one is genuinely ambiguous. Unset flows and
 * unscoped screens behave exactly as they did before.
 */
export function useTourScope(scope: string) {
  const { setScope } = useCairn();

  useEffect(() => {
    setScope(scope);

    // Only clear what we set. Two scoped components briefly overlapping during
    // a transition would otherwise have the outgoing one erase the incoming.
    return () => setScope((current) => (current === scope ? null : current));
  }, [scope, setScope]);
}
