#!/usr/bin/env node
/**
 * Measures what each package actually costs, gzipped.
 *
 * The numbers on the landing page were measured by hand once, which is how
 * `@cairnkit/ui` came to advertise 4.3 kb while really costing 6.4 — the CSS
 * was left out of the count. Anything published as a claim should be
 * reproducible with one command, so this is that command.
 *
 *   node scripts/measure-size.mjs
 *   node scripts/measure-size.mjs --check   # fails if the site is stale
 *
 * Measures the built ESM entry plus any CSS the package requires. That is the
 * honest ceiling: a consumer importing one hook will tree-shake below it,
 * but nobody can end up above it.
 */
import { gzipSync } from "node:zlib";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} kb`;

function gzipped(...paths) {
  let total = 0;
  for (const path of paths) {
    const full = resolve(root, path);
    if (!existsSync(full)) {
      console.error(`✗ Missing ${path} — run \`pnpm build\` first.`);
      process.exit(1);
    }
    total += gzipSync(readFileSync(full)).length;
  }
  return total;
}

// The overlay cannot render without its stylesheet, so the stylesheet is part
// of its cost. @floating-ui/dom is the only third-party runtime dependency and
// only `ui` pulls it in.
const FLOATING_UI =
  "packages/ui/node_modules/@floating-ui/dom/dist/floating-ui.dom.browser.min.mjs";

const packages = [
  { name: "@cairnkit/core", files: ["packages/core/dist/index.js"], optional: false },
  { name: "@cairnkit/react", files: ["packages/react/dist/index.js"], optional: false },
  { name: "@cairnkit/next", files: ["packages/next/dist/index.js"], optional: true },
  {
    name: "@cairnkit/ui",
    files: ["packages/ui/dist/index.js", "packages/ui/dist/index.css"],
    optional: true,
  },
];

const sizes = packages.map((pkg) => ({ ...pkg, bytes: gzipped(...pkg.files) }));
const by = (name) => sizes.find((s) => s.name === name).bytes;

const headless = by("@cairnkit/core") + by("@cairnkit/react") + by("@cairnkit/next");
const everything = headless + by("@cairnkit/ui") + gzipped(FLOATING_UI);
const widest = Math.max(...sizes.map((s) => s.bytes), 1);

console.log("\n  Gzipped, built output\n");
for (const s of sizes) {
  const bar = "█".repeat(Math.max(1, Math.round((s.bytes / widest) * 24)));
  const label = s.optional ? `${s.name} (optional)` : s.name;
  console.log(`  ${label.padEnd(30)} ${kb(s.bytes).padStart(8)}  ${bar}`);
}
console.log(`\n  ${"Headless (core+react+next)".padEnd(30)} ${kb(headless).padStart(8)}`);
console.log(`  ${"Everything (+ui, @floating-ui)".padEnd(30)} ${kb(everything).padStart(8)}\n`);

if (!process.argv.includes("--check")) process.exit(0);

// Keeps the landing page honest. The claims live in one array there; if these
// stop matching, the site is lying and CI should say so.
const site = readFileSync(resolve(root, "apps/web/app/page.tsx"), "utf8");
const claims = [
  ...sizes.map((s) => [s.name, kb(s.bytes)]),
  ["Headless total", kb(headless)],
  ["Everything total", kb(everything)],
];

let stale = false;
for (const [label, value] of claims) {
  if (!site.includes(`"${value}"`)) {
    console.error(`  ✗ ${label} measures ${value}, which the landing page does not claim.`);
    stale = true;
  }
}

if (stale) {
  console.error("\n  Update PACKAGES / TOTALS in apps/web/app/page.tsx.\n");
  process.exit(1);
}
console.log("  ✓ Landing page matches measured sizes.\n");
