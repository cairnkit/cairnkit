import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import type { CheckContext, Location } from "./checks/types";

/** Thrown rather than printed, so the command owns how it reads. */
export class MissingRoots extends Error {
  constructor(readonly roots: string[]) {
    super(`Missing: ${roots.join(", ")}`);
    this.name = "MissingRoots";
  }
}

const SOURCE = /\.(tsx?|jsx?)$/;
const SKIP = new Set(["node_modules", "dist", "build", ".next", ".git", "coverage"]);

/**
 * Walks source files without following symlinks out of the project.
 *
 * `cairnkit check` runs in CI on untrusted branches, so it only ever reads text
 * inside the given root — it never imports or executes project code.
 */
function walk(dir: string, root: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    if (SKIP.has(entry.name)) continue;

    const full = join(dir, entry.name);
    if (!resolve(full).startsWith(root + sep)) continue;

    if (entry.isDirectory()) walk(full, root, out);
    else if (SOURCE.test(entry.name)) out.push(full);
  }
  return out;
}

/**
 * Blanks out comments and string contents before scanning.
 *
 * The scanner is regex-based, so without this it cannot tell real code from
 * code *quoted inside* a template literal — a docs page showing
 * `defineAnchors({ ... })` in a sample would register phantom anchors and fail
 * the check. Replacing literals with same-length padding keeps offsets intact
 * while removing their content from consideration.
 */
function stripLiterals(source: string): string {
  const blank = (match: string) => match.replace(/[^\n]/g, " ");

  return source
    .replace(/\/\*[\s\S]*?\*\//g, blank) // block comments
    .replace(/\/\/[^\n]*/g, blank) // line comments
    .replace(/`(?:\\.|[^`\\])*`/g, blank) // template literals
    .replace(/"(?:\\.|[^"\\\n])*"/g, (m) => `"${" ".repeat(Math.max(0, m.length - 2))}"`)
    .replace(/'(?:\\.|[^'\\\n])*'/g, (m) => `'${" ".repeat(Math.max(0, m.length - 2))}'`);
}

/** Maps `group.key` registry paths back to the id they hold. */
function readRegistry(source: string): Map<string, string> {
  const paths = new Map<string, string>();

  for (const match of source.matchAll(/(\w+):\s*\{([^}]*)\}/gs)) {
    const group = match[1];
    const body = match[2];
    if (!group || !body) continue;

    for (const entry of body.matchAll(/(\w+):\s*["'`]([^"'`]+)["'`]/g)) {
      const key = entry[1];
      const value = entry[2];
      if (key && value) paths.set(`${group}.${key}`, value);
    }
  }

  return paths;
}

/**
 * Where to look when the caller names nothing.
 *
 * `src` was the only default, and `readdirSync` throws on a directory that is
 * not there — so any project without one (a Next app created with
 * --no-src-dir, for instance) got an unhandled ENOENT stack trace instead of
 * an answer. These are tried in order and the ones that exist are scanned.
 */
const DEFAULT_ROOTS = ["src", "app", "pages", "walkthrough", "lib", "components"];

export function defaultRoots(exists: (path: string) => boolean): string[] {
  const found = DEFAULT_ROOTS.filter(exists);
  // Nothing recognisable: scan the working directory. The skip list already
  // prunes node_modules and build output, and the pre-filter makes it cheap.
  return found.length > 0 ? found : ["."];
}

export function scanProject(rootDirs: string | string[]): CheckContext {
  // Several roots are normal: anchors in one folder, the components that use
  // them in another. Scanning only the first silently reported every anchor as
  // unapplied, which is a check that lies.
  const roots = (Array.isArray(rootDirs) ? rootDirs : [rootDirs]).map((dir) => resolve(dir));

  const missing = roots.filter((root) => !existsSync(root));
  if (missing.length > 0) {
    throw new MissingRoots(missing);
  }

  const files = roots.flatMap((root) => walk(root, root));

  const registered = new Set<string>();
  const applied = new Set<string>();
  const literals = new Set<string>();
  const flowAnchors = new Map<string, string[]>();
  const flowRoutes: CheckContext["flowRoutes"] = new Map();

  const registryPaths = new Map<string, string>();
  const sources = new Map<string, string>();
  const registryFiles = new Set<string>();
  /** Anchors applied via a bare string rather than a registry reference. */
  const untypedUse = new Map<string, Location>();
  const declaredAt = new Map<string, Location>();
  const stepAt = new Map<string, Location>();
  const literalAt = new Map<string, Location>();

  /**
   * `stripLiterals` is a character-by-character pass, and it used to run on
   * every file twice — once here and once below. On a 700-file app that was
   * ~420ms of the ~470ms total, nearly all of it spent proving that files with
   * no anchors in them have no anchors in them.
   *
   * Guarding on the raw text first is safe because stripping only ever removes
   * matches: if the raw source does not contain `defineAnchors(`, the stripped
   * source cannot either.
   */
  const stripped = new Map<string, string>();
  const strip = (file: string, raw: string) => {
    let value = stripped.get(file);
    if (value === undefined) {
      value = stripLiterals(raw);
      stripped.set(file, value);
    }
    return value;
  };

  for (const file of files) {
    const raw = readFileSync(file, "utf8");
    sources.set(file, raw);

    // Comments and template literals cannot declare anything; only their
    // presence would confuse the identifier scan below.
    const declaresRegistry =
      raw.includes("defineAnchors(") && strip(file, raw).includes("defineAnchors(");
    const source = declaresRegistry ? raw : "";
    if (declaresRegistry) registryFiles.add(file);

    if (source.includes("defineAnchors(")) {
      for (const [path, id] of readRegistry(source)) {
        registryPaths.set(path, id);
        registered.add(id);

        const at = source.indexOf(`"${id}"`);
        if (at >= 0) declaredAt.set(id, { file, offset: at });
      }
    }
  }

  const isFlowFile = (source: string) => source.includes("defineFlow(");

  /**
   * A file can only matter to this pass if it mentions cairnkit by name, spreads
   * an anchor, or contains one of the registered ids as a bare string.
   *
   * That last clause is load-bearing: config-driven UI passes ids as data —
   * `{ tourTarget: "nav.invite" }` names neither `cairn` nor `anchor`, and
   * dropping it would silently mark a live anchor as unapplied. One alternation
   * over the known ids keeps that case while skipping the ~94% of files that
   * cannot possibly contribute.
   */
  const ids = [...registered];
  const idPattern =
    ids.length > 0
      ? new RegExp(ids.map((id) => id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"))
      : null;

  const isRelevant = (raw: string) =>
    raw.includes("cairn") || raw.includes("anchor") || (idPattern?.test(raw) ?? false);

  for (const [file, raw] of sources) {
    if (!isRelevant(raw)) continue;
    const source = strip(file, raw);

    // Config-driven UI passes the id as data — `{ cairnAnchor: "nav.invite" }`
    // in a nav config, for instance. That is neither a data-cairn attribute nor
    // a registry member reference, so it used to read as never applied. The
    // registry file is excluded, or its own declarations would count as uses
    // and the check would pass no matter what.
    if (!registryFiles.has(file) && !isFlowFile(source)) {
      for (const match of raw.matchAll(/["'`]([a-z0-9-]+\.[a-z0-9-]+)["'`]/gi)) {
        const value = match[1];
        if (!value || !registered.has(value)) continue;
        applied.add(value);
        if (!untypedUse.has(value)) untypedUse.set(value, { file, offset: match.index ?? 0 });
      }
    }

    // Flow files *reference* anchors; only product code *applies* them.
    // Counting flow files here would make every anchor look applied forever.
    if (!isFlowFile(source)) {
      for (const match of source.matchAll(/[A-Za-z_$][\w$]*\.(\w+\.\w+)/g)) {
        const id = match[1] ? registryPaths.get(match[1]) : undefined;
        if (id) applied.add(id);
      }
      /*
       * Read from `raw`, not from the stripped source.
       *
       * A JSX attribute value *is* a string literal, and `stripLiterals`
       * replaces string contents with same-length padding. Matching this
       * pattern against the stripped text therefore captured a run of spaces
       * rather than the id: every `data-cairn="..."` in the codebase was
       * reported as "not in the registry" even when it was registered, and the
       * finding could not name the value it was complaining about.
       *
       * Offsets survive stripping intact, so the guard below is what keeps the
       * original protection. A `data-cairn=` inside a comment or a template
       * literal is blanked wholesale, attribute name included, so the stripped
       * text no longer starts with the attribute at that offset and the match
       * is skipped. A real attribute keeps its name, because only the quoted
       * value is padded.
       */
      for (const match of raw.matchAll(/data-cairn=["']([^"']+)["']/g)) {
        const at = match.index ?? 0;
        if (!source.startsWith("data-cairn=", at)) continue;

        const value = match[1];
        if (!value) continue;
        literals.add(value);
        applied.add(value);
        if (!literalAt.has(value)) literalAt.set(value, { file, offset: at });
      }
      continue;
    }

    /*
     * One flow at a time, not one file at a time.
     *
     * This block used to take the first `id:` in the file and attribute every
     * anchor, pause route and handoff in it to that one flow. A file holding
     * four `defineFlow` calls therefore reported one flow owning all of them,
     * and `cairnkit check` named the wrong flow in its findings: an anchor used
     * only by the fourth flow was reported as breaking the first.
     *
     * The segments are cut on `defineFlow(` in the *stripped* copy, so a call
     * quoted inside a docs snippet does not start a phantom flow, and the same
     * offsets are used to slice the raw copy because route strings live inside
     * string literals and are blanked in the stripped one.
     */
    const starts = [...source.matchAll(/defineFlow\s*\(/g)].map((m) => m.index ?? 0);

    for (let i = 0; i < starts.length; i += 1) {
      const from = starts[i] ?? 0;
      const to = starts[i + 1] ?? raw.length;

      // stripLiterals pads rather than removes, so both copies share offsets
      // and a slice of one lines up with the same slice of the other.
      const rawSegment = raw.slice(from, to);
      const segment = source.slice(from, to);

      const flowId = /id:\s*["'`]([^"'`]+)["'`]/.exec(rawSegment)?.[1];
      if (!flowId) continue;

      const anchors: string[] = [];
      for (const match of segment.matchAll(/anchor:\s*[A-Za-z_$][\w$]*\.(\w+\.\w+)/g)) {
        const id = match[1] ? registryPaths.get(match[1]) : undefined;
        if (!id) continue;
        anchors.push(id);
        // Back to file coordinates, or every finding points at the top of the
        // file rather than at the step.
        stepAt.set(`${flowId}::${id}`, { file, offset: from + (match.index ?? 0) });
      }
      flowAnchors.set(flowId, anchors);

      const pauseBlock = /pauseRoutes:\s*\[([^\]]*)\]/.exec(rawSegment)?.[1] ?? "";
      const pause = [...pauseBlock.matchAll(/["'`]([^"'`]+)["'`]/g)]
        .map((m) => m[1])
        .filter((value): value is string => Boolean(value));

      const handoff = [
        ...rawSegment.matchAll(
          /\{\s*pathname:\s*["'`]([^"'`]+)["'`],\s*flowId:\s*["'`]([^"'`]+)["'`]\s*\}/g,
        ),
      ]
        .map((m) => ({ pathname: m[1], flowId: m[2] }))
        .filter((entry): entry is { pathname: string; flowId: string } =>
          Boolean(entry.pathname && entry.flowId),
        );

      flowRoutes.set(flowId, { pause, handoff });
    }
  }

  return {
    registered,
    applied,
    literals,
    flowAnchors,
    flowRoutes,
    declaredAt,
    stepAt,
    literalAt,
    untypedUse,
  };
}
