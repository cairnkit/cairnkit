"use client";

import { useCallback } from "react";
import { devWarn, getFlow, type RegisteredFlowId } from "@cairnkit/core";
import { useCairn } from "../provider/cairn-context";

/**
 * Starts a flow, navigating to its entry route first when needed.
 *
 * Steps wait for their anchor, so starting before the route settles is safe —
 * and doing the navigation here means every launcher gets it for free.
 *
 * Separate from `useTour` so a launcher can start a tour without mounting the
 * driver alongside the overlay's. `useTour` binds advance listeners and fires
 * `onEnter`; a second copy does both twice.
 */
export function useStartTour() {
  const { store, flows, router, onEvent } = useCairn();
  const pathname = router.usePathname();

  return useCallback(
    (flowId: RegisteredFlowId) => {
      const target = getFlow(flows, flowId);

      if (!target) {
        // Silent here means a launcher that does nothing and gives no clue
        // why — usually a flow that was never passed to the provider, or a
        // second provider that does not know about it.
        const known = Object.keys(flows);
        devWarn(
          `No flow "${flowId}" is registered with this provider. ` +
            `Known flows: ${known.length ? known.join(", ") : "none"}.`,
        );
        return;
      }

      if (pathname !== target.entryRoute) router.navigate(target.entryRoute);
      store.start(flowId);
      onEvent?.({ name: "flow_started", props: { flowId, version: target.version } });
    },
    [flows, pathname, router, store, onEvent],
  );
}
