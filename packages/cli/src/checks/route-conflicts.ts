import { matchRoute } from "@cairnkit/core";
import type { Check, Finding } from "./types";

/**
 * A route cannot both pause a flow and hand it off. The engine resolves it
 * deterministically — handoff is checked first — but the author plainly meant
 * one of the two, and whichever they meant, half of what they wrote does
 * nothing.
 *
 * Overlap is tested with the engine's own matcher rather than string equality,
 * so a pattern is caught against a literal: pausing `/projects/:slug` while
 * handing off `/projects/acme` is the same mistake as listing one path twice,
 * and string equality sees neither of them.
 *
 * Two patterns that overlap without either matching the other — `/a/:x` and
 * `/:y/b` — are not caught. Deciding that in general is pattern intersection,
 * and a check that is right about the cases people actually write beats one
 * that is complete and unreadable.
 *
 * Also catches a flow handing off to itself, which loops.
 */
export const routeConflicts: Check = (ctx) => {
  const findings: Finding[] = [];

  for (const [flowId, routes] of ctx.flowRoutes) {
    const handoffPaths = routes.handoff.map((entry) => entry.pathname);

    const both = routes.pause.filter((path) =>
      handoffPaths.some(
        (handoffPath) =>
          path === handoffPath ||
          matchRoute(path, handoffPath) ||
          matchRoute(handoffPath, path),
      ),
    );
    if (both.length) {
      findings.push({
        rule: "route-conflicts",
        message: `flow "${flowId}" lists the same route as both pause and handoff`,
        detail: both.map((text) => ({ text })),
        hint: "Pick one. Handoff means another guide takes over; pause means nobody does.",
      });
    }

    const selfHandoff = routes.handoff.filter((entry) => entry.flowId === flowId);
    if (selfHandoff.length) {
      findings.push({
        rule: "route-conflicts",
        message: `flow "${flowId}" hands off to itself`,
        detail: selfHandoff.map((entry) => ({ text: entry.pathname })),
        hint: "Remove the entry — a flow already owns its own routes.",
      });
    }
  }

  return findings;
};
