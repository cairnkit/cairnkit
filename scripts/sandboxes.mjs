#!/usr/bin/env node
/**
 * Turns the workspace examples into standalone StackBlitz projects.
 *
 *   node scripts/sandboxes.mjs build     regenerate sandboxes/
 *   node scripts/sandboxes.mjs check     fail if sandboxes/ is stale or hand-edited
 *   node scripts/sandboxes.mjs verify    install + build each one for real
 *   node scripts/sandboxes.mjs urls      print the StackBlitz links
 *
 * Why generate rather than hand-write: the examples are typechecked, built and
 * audited in CI, so they cannot rot. A hand-written copy of them can, and would
 * — silently, because nothing installs it. Generating from the tested source
 * and failing the build when the copy drifts is the only version of this that
 * stays true.
 *
 * The one thing StackBlitz cannot do is resolve `workspace:*`, so that rewrite
 * is the whole job. Everything else here exists to stop that rewrite being
 * wrong: versions come from the workspace packages, and `build` refuses to
 * emit a version that is not actually on npm.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG = JSON.parse(readFileSync(join(ROOT, "scripts/sandboxes.config.json"), "utf8"));
const OUT = join(ROOT, CONFIG.outDir);
const MANIFEST = ".generated.json";
const SITE_MANIFEST = join(ROOT, "apps/web/lib/sandboxes.json");

const green = (s) => `[32m${s}[0m`;
const red = (s) => `[31m${s}[0m`;
const dim = (s) => `[2m${s}[0m`;

/** The version every `workspace:*` becomes. Changesets keeps these current. */
function workspaceVersions() {
  const versions = new Map();
  for (const name of readdirSync(join(ROOT, "packages"))) {
    const manifest = join(ROOT, "packages", name, "package.json");
    if (!existsSync(manifest)) continue;
    const pkg = JSON.parse(readFileSync(manifest, "utf8"));
    versions.set(pkg.name, pkg.version);
  }
  return versions;
}

/**
 * A sandbox pinned to a version npm has never seen fails on install, and the
 * failure looks like a broken library rather than a broken link. Cheap to
 * check, so it is checked every build.
 */
function assertPublished(name, version) {
  try {
    const out = execFileSync("npm", ["view", `${name}@${version}`, "version"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 20_000,
    }).trim();
    return out === version;
  } catch {
    return false;
  }
}

function walk(dir, base = dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const rel = relative(base, full);
    if (CONFIG.stripPaths.some((p) => rel === p || rel.startsWith(`${p}/`))) continue;
    if (entry.isDirectory()) walk(full, base, out);
    else out.push(rel);
  }
  return out;
}

function rewritePackageJson(raw, versions, sandbox) {
  const pkg = JSON.parse(raw);

  // A scoped name reads as if you could install the sandbox itself.
  pkg.name = `cairnkit-sandbox-${sandbox.name}`;
  delete pkg.private;

  for (const field of ["dependencies", "devDependencies"]) {
    if (!pkg[field]) continue;
    for (const dep of Object.keys(pkg[field])) {
      if (CONFIG.stripDependencies.includes(dep)) {
        delete pkg[field][dep];
        continue;
      }
      if (!String(pkg[field][dep]).startsWith("workspace:")) continue;

      const version = versions.get(dep);
      if (!version) throw new Error(`${sandbox.name}: no workspace version for ${dep}`);
      pkg[field][dep] = `^${version}`;
    }
    if (Object.keys(pkg[field]).length === 0) delete pkg[field];
  }

  for (const script of CONFIG.stripScripts) delete pkg.scripts?.[script];

  return `${JSON.stringify(pkg, null, 2)}\n`;
}

function hashTree(dir) {
  const hash = createHash("sha256");
  for (const rel of walk(dir).sort()) {
    if (rel === MANIFEST) continue;
    hash.update(rel);
    hash.update(readFileSync(join(dir, rel)));
  }
  return hash.digest("hex").slice(0, 16);
}

function build({ quiet = false, into = OUT, siteFile = SITE_MANIFEST } = {}) {
  const versions = workspaceVersions();
  const log = (...args) => !quiet && console.log(...args);
  const results = [];

  // One registry check per package, not per sandbox.
  const needed = new Set();
  for (const sandbox of CONFIG.sandboxes) {
    const pkg = JSON.parse(readFileSync(join(ROOT, sandbox.source, "package.json"), "utf8"));
    for (const field of ["dependencies", "devDependencies"]) {
      for (const [dep, range] of Object.entries(pkg[field] ?? {})) {
        if (String(range).startsWith("workspace:") && !CONFIG.stripDependencies.includes(dep)) {
          needed.add(dep);
        }
      }
    }
  }
  for (const dep of needed) {
    const version = versions.get(dep);
    if (!assertPublished(dep, version)) {
      console.error(red(`✗ ${dep}@${version} is not on npm.`));
      console.error(dim("  Sandboxes point at published packages; release first, then rebuild."));
      process.exit(1);
    }
  }
  log(dim(`  verified ${needed.size} package(s) published`));

  rmSync(into, { recursive: true, force: true });

  for (const sandbox of CONFIG.sandboxes) {
    const from = join(ROOT, sandbox.source);
    const to = join(into, sandbox.name);
    if (!existsSync(from)) throw new Error(`missing source: ${sandbox.source}`);

    for (const rel of walk(from)) {
      const target = join(to, rel);
      mkdirSync(dirname(target), { recursive: true });
      if (rel === "package.json") {
        writeFileSync(
          target,
          rewritePackageJson(readFileSync(join(from, rel), "utf8"), versions, sandbox),
        );
      } else {
        cpSync(join(from, rel), target);
      }
    }

    writeFileSync(
      join(to, ".stackblitzrc"),
      `${JSON.stringify({ installDependencies: true, startCommand: sandbox.startCommand }, null, 2)}\n`,
    );

    writeFileSync(join(to, "README.md"), readme(sandbox));

    // Belt and braces: a `workspace:` that survives would fail at install with
    // an error that points nowhere near this script.
    const leaked = walk(to).filter((rel) =>
      readFileSync(join(to, rel), "utf8").includes("workspace:*"),
    );
    if (leaked.length) {
      console.error(red(`✗ ${sandbox.name}: workspace:* survived in ${leaked.join(", ")}`));
      process.exit(1);
    }

    const files = walk(to).length;
    writeFileSync(
      join(to, MANIFEST),
      `${JSON.stringify(
        {
          generatedFrom: sandbox.source,
          generator: "scripts/sandboxes.mjs",
          warning: "Generated. Edit the example it came from, then run: pnpm sandboxes",
        },
        null,
        2,
      )}\n`,
    );

    results.push({ ...sandbox, files });
    log(
      `  ${green("+")} ${sandbox.name.padEnd(12)} ${dim(`${files} files from ${sandbox.source}`)}`,
    );
  }

  // The docs site reads this rather than hardcoding links, so a renamed or
  // added sandbox cannot leave a dead button on the page.
  mkdirSync(dirname(siteFile), { recursive: true });
  writeFileSync(
    siteFile,
    `${JSON.stringify(
      urls().map(({ name, title, blurb, url, openFile }) => ({
        name,
        title,
        blurb,
        url,
        openFile,
      })),
      null,
      2,
    )}\n`,
  );
  log(dim(`  wrote ${relative(ROOT, siteFile)}`));

  return results;
}

function readme(sandbox) {
  return `# ${sandbox.title}

${sandbox.blurb}

> **Generated — do not edit.** This is a standalone copy of
> [\`${sandbox.source}\`](../../${sandbox.source}), rewritten so it installs from npm
> instead of the workspace. Change the example, then run \`pnpm sandboxes\`.

\`\`\`bash
npm install
${sandbox.startCommand}
\`\`\`

Open [\`${sandbox.openFile}\`](${sandbox.openFile}) to see the tour itself — it is
plain data, and every anchor it points at is a typed identifier rather than a
CSS selector.

Then try breaking it: rename an anchor in the registry and run \`npx cairn check\`.
`;
}

function urls() {
  return CONFIG.sandboxes.map((s) => ({
    ...s,
    url:
      `https://stackblitz.com/github/${CONFIG.repo}/tree/${CONFIG.branch}/${CONFIG.outDir}/${s.name}` +
      `?file=${encodeURIComponent(s.openFile)}&terminal=${encodeURIComponent(s.startCommand.replace(/^npm run /, ""))}`,
  }));
}

// ── commands ──────────────────────────────────────────────────────────────
const command = process.argv[2] ?? "build";

if (command === "build") {
  console.log("\nGenerating sandboxes\n");
  build();
  console.log(`\n${green("✓")} ${CONFIG.outDir}/ regenerated\n`);
} else if (command === "check") {
  /**
   * Compares a fresh generation against what is committed. Catches both a
   * stale sandbox and someone editing the generated copy by hand.
   *
   * Generated into a scratch directory, never over the committed one. Writing
   * in place made this a check that repaired what it was checking: the first
   * run reported "stale" and quietly fixed the tree, a second run passed, and
   * the next `git add -A` swept the regenerated files into a commit nobody
   * had reviewed.
   */
  const scratch = mkdtempSync(join(tmpdir(), "cairn-sandboxes-"));

  try {
    build({ quiet: true, into: scratch, siteFile: join(scratch, "sandboxes.json") });

    const drifted = CONFIG.sandboxes
      .map((s) => s.name)
      .filter(
        (name) =>
          !existsSync(join(OUT, name)) ||
          hashTree(join(OUT, name)) !== hashTree(join(scratch, name)),
      );

    const committed = existsSync(SITE_MANIFEST) ? readFileSync(SITE_MANIFEST, "utf8") : "";
    if (committed !== readFileSync(join(scratch, "sandboxes.json"), "utf8")) {
      drifted.push(relative(ROOT, SITE_MANIFEST));
    }

    if (drifted.length) {
      console.error(red(`\n✗ sandboxes are stale: ${drifted.join(", ")}`));
      console.error(dim("  Run `pnpm sandboxes` and commit the result.\n"));
      process.exit(1);
    }
    console.log(green("✓ sandboxes match their examples"));
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
} else if (command === "verify") {
  // The only test that proves a sandbox works: install it from the registry
  // exactly as StackBlitz will, then build it.
  console.log("\nVerifying sandboxes install and build from npm\n");
  build({ quiet: true });

  let failed = 0;
  for (const sandbox of CONFIG.sandboxes) {
    const dir = join(OUT, sandbox.name);
    process.stdout.write(`  ${sandbox.name.padEnd(12)} `);
    try {
      execFileSync("npm", ["install", "--no-audit", "--no-fund", "--silent"], {
        cwd: dir,
        stdio: "ignore",
        timeout: 300_000,
      });
      execFileSync("npm", ["run", "build"], { cwd: dir, stdio: "ignore", timeout: 300_000 });
      console.log(green("installs and builds"));
    } catch (error) {
      console.log(red(`FAILED — ${String(error.message).split("\n")[0]}`));
      failed += 1;
    } finally {
      rmSync(join(dir, "node_modules"), { recursive: true, force: true });
      rmSync(join(dir, "package-lock.json"), { force: true });
    }
  }
  console.log("");
  process.exit(failed > 0 ? 1 : 0);
} else if (command === "urls") {
  for (const s of urls()) console.log(`${s.title}\n  ${s.url}\n`);
} else {
  console.error(`Unknown command "${command}". Use: build | check | verify | urls`);
  process.exit(1);
}
