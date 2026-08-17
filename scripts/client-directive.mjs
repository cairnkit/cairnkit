#!/usr/bin/env node
/**
 * Puts `"use client"` at the top of the bundles that need it, and fails the
 * build if it is ever missing.
 *
 * Why this is a script and not tsup's `banner` option: every module in these
 * three packages already declares the directive in `src/`, and none of them
 * survive bundling. esbuild concatenates the modules and cannot hoist twenty
 * per-file directives into the one position a bundle has for them, and `banner`
 * only lands for the package that does not treeshake. `@cairnkit/react` and
 * `@cairnkit/next` both set `treeshake: true`, which runs rollup over esbuild's
 * output, and rollup drops a string literal it did not put there itself. So the
 * banner worked for `ui` and silently did nothing for the other two, which is a
 * worse failure than not having it at all.
 *
 * What it costs to get this wrong: Next reads a bundle with no directive as a
 * server module, so the first server component to import from one of these
 * throws at module evaluation with "createContext only works in Client
 * Components". Nothing in the library's own tests or typecheck can see that,
 * because it is a property of the published file rather than of the source. It
 * shipped in every version up to 0.12.1 for exactly that reason, which is why
 * `check` exists and runs in CI rather than this being an apply-and-hope.
 *
 * Bundlers with no concept of the directive ignore the string, so this is safe
 * for Vite, webpack and plain React consumers. Rollup warns about a module-level
 * directive when bundling, which is noise rather than a problem.
 *
 * Wired into `build` and into `dev`'s `--onSuccess`, because the examples and the
 * docs site consume these packages through `workspace:*` and therefore read
 * `dist/` directly. Watch mode rewrites the bundle on every save, so leaving it
 * out would mean the directive was correct in a release and absent for everyone
 * running `pnpm dev`.
 *
 * Usage:
 *   node scripts/client-directive.mjs apply    # after building, cwd = package
 *   node scripts/client-directive.mjs check    # in CI, after building
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIRECTIVE = '"use client";';

/**
 * Every package whose whole surface is hooks, context or a component.
 *
 * `core` is deliberately absent: it is plain functions with no React import, and
 * marking it client-only would stop a server component calling `anchor()` or
 * `defineFlow()`, which is a normal thing to do in a flows file. `cli` and
 * `cloud` never touch React either.
 */
const PACKAGES = ["react", "ui", "next"];

/** Both module formats. A consumer on either one hits the same problem. */
const BUNDLES = ["dist/index.js", "dist/index.cjs"];

/**
 * `use strict` leads the cjs output and stays leading, so the directive goes
 * after it rather than above it. Two in a row is valid, since the prologue runs
 * until the first statement that is not a bare string, but keeping the
 * conventional order means nobody has to know that to trust the file.
 *
 * Both quote styles, because the two toolchains disagree: esbuild's own output
 * uses double quotes and rollup rewrites them to single, so `ui` and `react`
 * genuinely differ here. Matching only one style is how the first version of
 * this put `"use client"` above `"use strict"` in exactly one of six bundles.
 */
const STRICT = /^(["']use strict["'];\n)/;

function insert(source) {
  if (STRICT.test(source)) return source.replace(STRICT, `$1${DIRECTIVE}\n`);
  return `${DIRECTIVE}\n${source}`;
}

/** Only in the prologue counts. Further down it is an ordinary string literal. */
function hasDirective(source) {
  const prologue = source.slice(0, 200).replace(STRICT, "");
  return /^["']use client["'];/.test(prologue);
}

const mode = process.argv[2];
if (mode !== "apply" && mode !== "check") {
  console.error("usage: client-directive.mjs <apply|check>");
  process.exit(2);
}

/*
 * `apply` touches only the package that invoked it, `check` sweeps all of them.
 *
 * The asymmetry is deliberate. pnpm runs the package builds in parallel with
 * `clean: true`, so a version of this that patched all three on every invocation
 * would read one package's dist while another process was still writing it. It
 * also reported "4 bundles" from a run that had built two, which is how the race
 * announced itself.
 */
const targets =
  mode === "apply" ? [process.cwd()] : PACKAGES.map((pkg) => join(ROOT, "packages", pkg));

const missing = [];
const changed = [];

for (const dir of targets) {
  for (const bundle of BUNDLES) {
    const path = join(dir, bundle);

    /*
     * A bundle that is not there yet is not a failure to report here. `check`
     * runs after `pnpm build` in CI, and saying "not built" in the voice of
     * "your directive is missing" would send the next person looking in the
     * wrong place.
     */
    if (!existsSync(path)) continue;

    const source = readFileSync(path, "utf8");
    if (hasDirective(source)) continue;

    if (mode === "check") {
      missing.push(relative(ROOT, path));
      continue;
    }

    writeFileSync(path, insert(source));
    changed.push(relative(ROOT, path));
  }
}

if (mode === "check") {
  if (missing.length === 0) {
    console.log(`✓ "use client" present in every client bundle`);
    process.exit(0);
  }

  console.error(`✗ "use client" missing from ${missing.length} bundle(s):\n`);
  for (const path of missing) console.error(`  ${path}`);
  console.error(`\n  A server component importing from these throws at module evaluation.`);
  console.error(`  Run \`pnpm build\`, which applies it, rather than patching dist by hand.`);
  process.exit(1);
}

if (changed.length > 0) console.log(`  "use client" → ${changed.length} bundle(s)`);
