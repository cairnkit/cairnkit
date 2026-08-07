import type { Check } from "./types";

/**
 * A route cannot both pause a flow and hand it off — the engine would have to
 * guess, and the user would get different behaviour depending on order.
 *
 * Also catches a flow handing off to itself, which loops.
 */
export const routeConflicts: Check = (ctx) => {
  const findings = [];

  for (const [flowId, routes] of ctx.flowRoutes) {
    const handoffPaths = routes.handoff.map((entry) => entry.pathname);

    const both = routes.pause.filter((path) => handoffPaths.includes(path));
    if (both.length) {
      findings.push({
        rule: "route-conflicts",
        message: `flow "${flowId}" lists the same route as both pause and handoff`,
        detail: both,
        hint: "Pick one. Handoff means another guide takes over; pause means nobody does.",
      });
    }

    const selfHandoff = routes.handoff.filter((entry) => entry.flowId === flowId);
    if (selfHandoff.length) {
      findings.push({
        rule: "route-conflicts",
        message: `flow "${flowId}" hands off to itself`,
        detail: selfHandoff.map((entry) => entry.pathname),
        hint: "Remove the entry — a flow already owns its own routes.",
      });
    }
  }

  return findings;
};
