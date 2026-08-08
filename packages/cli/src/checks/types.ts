/**
 * Where something was declared or referenced.
 *
 * Stores a byte offset rather than a line: the offset is free (the regex
 * already yields it), while counting newlines is O(offset). Resolved to a
 * line only when a finding is actually printed, so a passing check — the
 * overwhelmingly common case — pays nothing.
 */
export type Location = { file: string; offset: number };

export type Finding = {
  rule: string;
  message: string;
  /** Each line may carry a location, printed as `path:line`. */
  detail?: { text: string; at?: Location }[];
  hint?: string;
};

export type CheckContext = {
  /** Anchor ids declared in the registry. */
  registered: Set<string>;
  /** Anchor ids actually spread onto an element in product code. */
  applied: Set<string>;
  /** Raw `data-cairn` literals found in product code. */
  literals: Set<string>;
  /** Flow id -> the anchor ids its steps reference. */
  flowAnchors: Map<string, string[]>;
  /** Anchor id -> where it was declared in the registry. */
  declaredAt: Map<string, Location>;
  /** `flowId::anchorId` -> the step that references it. */
  stepAt: Map<string, Location>;
  /** Raw `data-cairn` literal -> where it appears. */
  literalAt: Map<string, Location>;
  /** Anchors applied by bare string rather than a typed registry reference. */
  untypedUse: Map<string, Location>;
  /** Flow id -> route lists, for contradiction checks. */
  flowRoutes: Map<string, { pause: string[]; handoff: { pathname: string; flowId: string }[] }>;
};

export type Check = (ctx: CheckContext) => Finding[];
