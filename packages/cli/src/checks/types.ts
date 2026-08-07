export type Finding = {
  rule: string;
  message: string;
  detail?: string[];
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
  /** Flow id -> route lists, for contradiction checks. */
  flowRoutes: Map<string, { pause: string[]; handoff: { pathname: string; flowId: string }[] }>;
};

export type Check = (ctx: CheckContext) => Finding[];
