import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import type { CheckContext, Location } from "./checks/types";

const SOURCE = /\.(tsx?|jsx?)$/;
const SKIP = new Set(["node_modules", "dist", "build", ".next", ".git", "coverage"]);

/**
 * Walks source files without following symlinks out of the project.
 *
 * `cairn check` runs in CI on untrusted branches, so it only ever reads text
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

export function scanProject(rootDir: string): CheckContext {
  const root = resolve(rootDir);
  const files = walk(root, root);

  const registered = new Set<string>();
  const applied = new Set<string>();
  const literals = new Set<string>();
  const flowAnchors = new Map<string, string[]>();
  const flowRoutes: CheckContext["flowRoutes"] = new Map();

  const registryPaths = new Map<string, string>();
  const sources = new Map<string, string>();
  const declaredAt = new Map<string, Location>();
  const stepAt = new Map<string, Location>();
  const literalAt = new Map<string, Location>();

  for (const file of files) {
    const raw = readFileSync(file, "utf8");
    // Comments and template literals cannot declare anything; only their
    // presence would confuse the identifier scan below.
    const source = stripLiterals(raw).includes("defineAnchors(") ? raw : "";
    sources.set(file, raw);

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

  for (const [file, raw] of sources) {
    const source = stripLiterals(raw);

    // Flow files *reference* anchors; only product code *applies* them.
    // Counting flow files here would make every anchor look applied forever.
    if (!isFlowFile(source)) {
      for (const match of source.matchAll(/[A-Za-z_$][\w$]*\.(\w+\.\w+)/g)) {
        const id = match[1] ? registryPaths.get(match[1]) : undefined;
        if (id) applied.add(id);
      }
      for (const match of source.matchAll(/data-cairn=["']([^"']+)["']/g)) {
        const value = match[1];
        if (!value) continue;
        literals.add(value);
        applied.add(value);
        if (!literalAt.has(value)) literalAt.set(value, { file, offset: match.index ?? 0 });
      }
      continue;
    }

    const flowId = /id:\s*["'`]([^"'`]+)["'`]/.exec(raw)?.[1];
    if (!flowId) continue;

    const anchors: string[] = [];
    for (const match of source.matchAll(/anchor:\s*[A-Za-z_$][\w$]*\.(\w+\.\w+)/g)) {
      const id = match[1] ? registryPaths.get(match[1]) : undefined;
      if (!id) continue;
      anchors.push(id);
      stepAt.set(`${flowId}::${id}`, { file, offset: match.index ?? 0 });
    }
    flowAnchors.set(flowId, anchors);

    const pauseBlock = /pauseRoutes:\s*\[([^\]]*)\]/.exec(raw)?.[1] ?? "";
    const pause = [...pauseBlock.matchAll(/["'`]([^"'`]+)["'`]/g)]
      .map((m) => m[1])
      .filter((value): value is string => Boolean(value));

    const handoff = [
      ...raw.matchAll(
        /\{\s*pathname:\s*["'`]([^"'`]+)["'`],\s*flowId:\s*["'`]([^"'`]+)["'`]\s*\}/g,
      ),
    ]
      .map((m) => ({ pathname: m[1], flowId: m[2] }))
      .filter((entry): entry is { pathname: string; flowId: string } =>
        Boolean(entry.pathname && entry.flowId),
      );

    flowRoutes.set(flowId, { pause, handoff });
  }

  return { registered, applied, literals, flowAnchors, flowRoutes, declaredAt, stepAt, literalAt };
}
