"use client";

import { useMemo } from "react";
import { decideForRoute, getFlow, type RouteDecision, type TourFlow } from "@cairnkit/core";
import { useCairn } from "../provider/cairn-context";
import { useTourState } from "./use-cairn-store";

const NO_DECISION: RouteDecision = { kind: "none" };

export type ActiveTour = {
  flow: TourFlow | null;
  stepIndex: number;
  /** The router's current pathname, so callers need not ask for it twice. */
  pathname: string;
  /** What that pathname means for this flow. */
  decision: RouteDecision;
  /**
   * Dormant — wrong route or wrong scope. Still the active flow, so it resumes
   * on the same step when the user comes back.
   */
  isPaused: boolean;
};

/**
 * Where the running tour stands, with no side effects.
 *
 * `useTour` is the driver: it binds advance listeners, fires `onEnter`, and
 * ends flows whose anchor never arrived. Mounting it twice does all of that
 * twice. Anything that only needs to *look* at the tour — a launcher deciding
 * whether to show, a custom progress bar — reads it here instead.
 */
export function useActiveTour(): ActiveTour {
  const { flows, router, scope } = useCairn();
  const pathname = router.usePathname();

  const activeFlowId = useTourState((state) => state.activeFlowId);
  const stepIndex = useTourState((state) => state.stepIndex);

  const flow = getFlow(flows, activeFlowId);

  const decision = useMemo(
    () => (flow ? decideForRoute(flow, pathname, stepIndex) : NO_DECISION),
    [flow, pathname, stepIndex],
  );

  // Both sides have to be explicit. A flow without a scope goes anywhere, and
  // an app that never declares one constrains nothing — so this only bites
  // when a scoped flow meets a screen that has said it is somewhere else.
  const outOfScope = Boolean(flow?.scope) && scope !== null && scope !== flow?.scope;

  return {
    flow,
    stepIndex,
    pathname,
    decision,
    isPaused: outOfScope || decision.kind === "pause" || decision.kind === "handoff",
  };
}
