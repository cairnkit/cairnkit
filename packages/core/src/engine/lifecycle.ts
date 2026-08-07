import { resolveResumeStep } from "../flows/resume";
import type { TourFlow } from "../flows/types";

export type RouteDecision =
  | { kind: "handoff"; flowId: string }
  | { kind: "pause" }
  | { kind: "resume"; stepIndex: number }
  | { kind: "none" };

/**
 * What a pathname means for the running flow, resolved in one place.
 *
 * Order matters and is deliberate:
 *
 *   1. handoff — another guide owns this route, switch to it
 *   2. pause   — nobody covers this route, go dormant and wait
 *   3. resume  — the user got ahead of the guide, catch up
 *
 * A route in both `handoffRoutes` and `pauseRoutes` would be ambiguous; the
 * CLI rejects that so this function never has to guess.
 */
export function decideForRoute(
  flow: Pick<TourFlow, "handoffRoutes" | "pauseRoutes" | "resumeAt">,
  pathname: string,
  stepIndex: number,
): RouteDecision {
  const handoff = flow.handoffRoutes?.find((entry) => entry.pathname === pathname);
  if (handoff) return { kind: "handoff", flowId: handoff.flowId };

  if (flow.pauseRoutes?.includes(pathname)) return { kind: "pause" };

  const resumeIndex = resolveResumeStep(flow, pathname, stepIndex);
  if (resumeIndex !== null) return { kind: "resume", stepIndex: resumeIndex };

  return { kind: "none" };
}
