#!/usr/bin/env node
/**
 * Audits only what we actually publish.
 *
 * `pnpm audit` at the workspace root walks every project, including the
 * examples and the docs site. Those are never published, so an advisory in the
 * example's router — or in the site's copy of Next — fails the build over
 * something no consumer can possibly install.
 *
 * A gate that fails for reasons outside the release is worse than no gate:
 * people learn to ignore it, and then miss the one that matters. This narrows
 * the check to the dependency closure our packages really ship.
 *
 * Usage: node scripts/audit-published.mjs [--audit-level high]
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const LEVELS = ["info", "low", "moderate", "high", "critical"];
const levelFlag = process.argv.indexOf("--audit-level");
const failAt = levelFlag === -1 ? "high" : (process.argv[levelFlag + 1] ?? "high");

const deps = {};
for (const name of readdirSync("packages")) {
  const manifest = JSON.parse(readFileSync(join("packages", name, "package.json"), "utf8"));
  if (manifest.private) continue;

  for (const [dep, range] of Object.entries(manifest.dependencies ?? {})) {
    // Workspace siblings are audited on their own account.
    if (dep.startsWith("@cairnkit/")) continue;
    deps[dep] = range;
  }
}

const names = Object.keys(deps);
if (names.length === 0) {
  console.log("✓ published packages ship no third-party runtime dependencies");
  process.exit(0);
}

const dir = mkdtempSync(join(tmpdir(), "cairn-audit-"));
writeFileSync(
  join(dir, "package.json"),
  JSON.stringify({ name: "cairn-published-deps", version: "0.0.0", dependencies: deps }, null, 2),
);

// Lockfile only — we need the resolved tree to audit, not the packages.
execFileSync("npm", ["install", "--package-lock-only", "--ignore-scripts"], {
  cwd: dir,
  stdio: "ignore",
});

let report;
try {
  report = execFileSync("npm", ["audit", "--json"], { cwd: dir, encoding: "utf8" });
} catch (error) {
  // npm audit exits non-zero whenever it finds anything; the JSON is still on stdout.
  report = error.stdout ?? "{}";
}

const found = Object.values(JSON.parse(report).vulnerabilities ?? {});
const blocking = found.filter((v) => LEVELS.indexOf(v.severity) >= LEVELS.indexOf(failAt));

console.log(`Audited ${names.length} shipped dependency(ies): ${names.join(", ")}`);

if (blocking.length === 0) {
  console.log(`✓ no ${failAt}+ advisories in anything we publish`);
  process.exit(0);
}

console.error(`\n✗ ${blocking.length} ${failAt}+ advisory(ies) in published dependencies:\n`);
for (const v of blocking) {
  console.error(`  ${v.severity.padEnd(9)} ${v.name}  ${v.range}`);
}
console.error("\nThese ship to consumers. Bump them, or add an override in the root package.json.\n");
process.exit(1);
