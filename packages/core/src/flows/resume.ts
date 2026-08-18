import type { TourFlow } from "./types";
import { matchRoute } from "./match-route";

/**
 * Where the tour should pick up when the user navigates ahead of the guide.
 *
 * Users routinely click the button a step or two before the guide points at
 * it. When that navigates, every anchor on the old page vanishes at once and
 * the tour would otherwise die on a screen they are no longer looking at.
 *
 * Returns the step index to resume at, or null to leave the tour alone.
 */
export function resolveResumeStep(
  flow: Pick<TourFlow, "resumeAt">,
  pathname: string,
  stepIndex: number,
): number | null {
  const match = flow.resumeAt?.find((entry) => matchRoute(entry.pathname, pathname));
  if (!match) return null;

  // Only ever move forward. Rewinding someone already deep in a form would
  // show copy that no longer describes their state — worse than ending.
  if (match.stepIndex <= stepIndex) return null;

  return match.stepIndex;
}
