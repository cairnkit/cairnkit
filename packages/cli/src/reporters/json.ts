import type { CheckContext, Finding } from "../checks/types";
import { resolveLocation } from "../location";

/**
 * Machine-readable output, for anything that is not a person reading a terminal.
 *
 * The console reporter writes for a human: colour, indentation, a hint at the
 * end. Every one of those helps a reader and hurts a parser, and scraping ANSI
 * codes out of terminal text is how integrations break on a cosmetic change.
 *
 * Written for three consumers that already want it:
 *
 *   an agent      the anchor graph is the one thing it cannot derive by
 *                 grepping, because it needs registry resolution and the
 *                 flow-file exclusion rule
 *   CI            findings as data, so a job can annotate a diff rather than
 *                 paste a log
 *   editors       the same feed a future extension would need
 *
 * `version` is on the payload deliberately. This is a contract the moment
 * anything consumes it, and a consumer needs to be able to tell an old shape
 * from a new one without guessing from which keys happen to be present.
 */
const SCHEMA_VERSION = 1;

export type JsonLocation = { file: string; line: number };

export type StatusReport = {
  version: number;
  summary: {
    registered: number;
    applied: number;
    /** Registered, but no element carries it. These break a flow at runtime. */
    orphaned: number;
    /** Applied to an element, but absent from the registry. */
    unregistered: number;
    flows: number;
  };
  anchors: {
    id: string;
    registered: boolean;
    applied: boolean;
    /**
     * How it reached an element. `typed` is the documented spread, `literal` is
     * a bare `data-cairn` attribute, `null` is nowhere.
     *
     * Worth exposing rather than collapsing into `applied`, because the two
     * fail differently: a typed reference stops compiling when the registry
     * changes, a literal does not.
     */
    appliedAs: "typed" | "literal" | null;
    declaredAt: JsonLocation | null;
    /** Flows whose steps point at this anchor. */
    flows: string[];
  }[];
  flows: { id: string; anchors: string[] }[];
};

export type CheckReport = {
  version: number;
  ok: boolean;
  registered: number;
  findings: {
    rule: string;
    message: string;
    hint: string | null;
    detail: { text: string; at: JsonLocation | null }[];
  }[];
};

export function statusReport(context: CheckContext): StatusReport {
  const flowsByAnchor = new Map<string, string[]>();
  for (const [flowId, anchorIds] of context.flowAnchors) {
    for (const id of anchorIds) {
      const list = flowsByAnchor.get(id);
      if (list) list.push(flowId);
      else flowsByAnchor.set(id, [flowId]);
    }
  }

  // Every id the project knows about, from either direction. A literal applied
  // without being registered is exactly the case worth surfacing, so it cannot
  // be built from the registry alone.
  const ids = [...new Set([...context.registered, ...context.literals])].sort();

  const anchors = ids.map((id) => {
    const registered = context.registered.has(id);
    const applied = context.applied.has(id);
    const declared = context.declaredAt.get(id);

    return {
      id,
      registered,
      applied,
      appliedAs: applied ? (context.literals.has(id) ? ("literal" as const) : ("typed" as const)) : null,
      declaredAt: declared ? resolveLocation(declared) : null,
      flows: flowsByAnchor.get(id) ?? [],
    };
  });

  return {
    version: SCHEMA_VERSION,
    summary: {
      registered: context.registered.size,
      applied: [...context.registered].filter((id) => context.applied.has(id)).length,
      orphaned: [...context.registered].filter((id) => !context.applied.has(id)).length,
      unregistered: [...context.literals].filter((id) => !context.registered.has(id)).length,
      flows: context.flowAnchors.size,
    },
    anchors,
    flows: [...context.flowAnchors].map(([id, anchorIds]) => ({ id, anchors: anchorIds })),
  };
}

export function checkReport(findings: Finding[], registeredCount: number): CheckReport {
  return {
    version: SCHEMA_VERSION,
    ok: findings.length === 0,
    registered: registeredCount,
    findings: findings.map((finding) => ({
      rule: finding.rule,
      message: finding.message,
      hint: finding.hint ?? null,
      detail: (finding.detail ?? []).map((item) => ({
        text: item.text,
        at: item.at ? resolveLocation(item.at) : null,
      })),
    })),
  };
}

/**
 * Print a report as the only thing on stdout.
 *
 * Nothing else may write there in JSON mode. A stray log line makes the output
 * unparseable, and the caller has no way to tell a warning from corruption, so
 * every other message in this mode goes to stderr.
 */
export function printJson(report: StatusReport | CheckReport): void {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}
