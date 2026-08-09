import type { Context, Framework, PackageManager, Reader } from "./types";

/**
 * Works out what kind of project this is, without touching disk itself.
 *
 * Every branch here is a guess that can be wrong, so the rule throughout is to
 * fall back to something harmless rather than something plausible: an unknown
 * framework produces a stub the developer fills in, not an adapter that
 * compiles and then misbehaves at runtime.
 */
export function detect(reader: Reader): Context {
  const pkg = parseJson(reader.read("package.json")) ?? {};
  const deps: Record<string, string> = {
    ...(pkg.dependencies ?? {}),
    ...(pkg.devDependencies ?? {}),
  };

  const usesSrcDir = reader.exists("src");
  const tsconfigRaw = reader.read("tsconfig.json");
  const tsconfig = parseJson(stripJsonComments(tsconfigRaw ?? "")) ?? {};

  return {
    framework: detectFramework(reader, deps),
    usesSrcDir,
    alias: detectAlias(tsconfig),
    // A jsconfig-only project is still JavaScript; the type registry needs TS.
    typescript: Boolean(tsconfigRaw),
    bundler: deps.next
      ? "next"
      : deps.vite || reader.exists("vite.config.ts") || reader.exists("vite.config.js")
        ? "vite"
        : null,
    packageManager: detectPackageManager(reader, pkg),
    installed: Object.keys(deps).filter((name) => name.startsWith("@cairnkit/")),
    tsconfigInclude: Array.isArray(tsconfig.include) ? tsconfig.include : [],
  };
}

function detectFramework(reader: Reader, deps: Record<string, string>): Framework {
  if (deps.next) {
    // App Router wins when both exist — that is Next's own precedence for
    // routes, and it is where a new provider belongs.
    for (const dir of ["app", "src/app"]) {
      if (reader.exists(dir)) return { kind: "next-app", dir };
    }
    for (const dir of ["pages", "src/pages"]) {
      if (reader.exists(dir)) return { kind: "next-pages", dir };
    }
    // Next installed but neither directory present: almost certainly a fresh
    // App Router project mid-setup.
    return { kind: "next-app", dir: reader.exists("src") ? "src/app" : "app" };
  }

  // v7 moved everything into `react-router`; `react-router-dom` is a compat
  // shim there. Importing from the wrong one does not resolve.
  if (deps["react-router-dom"]) return { kind: "react-router", pkg: "react-router-dom" };
  if (deps["react-router"]) return { kind: "react-router", pkg: "react-router" };

  // Known, but not one we ship an adapter for. A stub is right: falling through
  // to `react` would hand them memoryRouter, and route-aware steps would just
  // quietly never fire.
  if (deps["@tanstack/react-router"]) {
    return { kind: "unknown", hint: "TanStack Router" };
  }

  if (deps.react) return { kind: "react" };
  return { kind: "unknown" };
}

/**
 * Reads the first single-segment path alias, e.g. `"@/*": ["./src/*"]` → `@`.
 *
 * Emitting `@/walkthrough/anchors` into a project with no alias is an instant
 * module-not-found, so this decides between alias and relative imports.
 */
function detectAlias(tsconfig: {
  compilerOptions?: { paths?: Record<string, unknown> };
}): Context["alias"] {
  const paths = tsconfig.compilerOptions?.paths;
  if (!paths) return null;

  for (const [key, value] of Object.entries(paths)) {
    const prefix = /^(.+)\/\*$/.exec(key)?.[1];
    if (!prefix) continue;

    // `["./src/*"]` → base "src";  `["./*"]` → base "" (the project root).
    const target = Array.isArray(value) ? String(value[0] ?? "") : String(value);
    const base = target.replace(/^\.\//, "").replace(/\*$/, "").replace(/\/$/, "");
    return { prefix, base };
  }
  return null;
}

function detectPackageManager(reader: Reader, pkg: { packageManager?: string }): PackageManager {
  // `packageManager` is authoritative when present — corepack enforces it.
  const declared = /^(npm|pnpm|yarn|bun)@/.exec(pkg.packageManager ?? "");
  if (declared?.[1]) return declared[1] as PackageManager;

  if (reader.exists("pnpm-lock.yaml")) return "pnpm";
  if (reader.exists("bun.lockb") || reader.exists("bun.lock")) return "bun";
  if (reader.exists("yarn.lock")) return "yarn";
  return "npm";
}

function parseJson(raw: string | null): any | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** tsconfig.json is JSONC in practice, and `JSON.parse` will not have it. */
function stripJsonComments(raw: string): string {
  let out = "";
  let inString = false;
  let inLine = false;
  let inBlock = false;

  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];
    const next = raw[i + 1];

    if (inLine) {
      if (char === "\n") {
        inLine = false;
        out += char;
      }
      continue;
    }
    if (inBlock) {
      if (char === "*" && next === "/") {
        inBlock = false;
        i += 1;
      }
      continue;
    }
    if (inString) {
      if (char === "\\") {
        out += char + (next ?? "");
        i += 1;
        continue;
      }
      if (char === '"') inString = false;
      out += char;
      continue;
    }
    if (char === '"') {
      inString = true;
      out += char;
      continue;
    }
    if (char === "/" && next === "/") {
      inLine = true;
      i += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      inBlock = true;
      i += 1;
      continue;
    }
    out += char;
  }

  // Trailing commas are legal in tsconfig and fatal to JSON.parse.
  return out.replace(/,(\s*[}\]])/g, "$1");
}
