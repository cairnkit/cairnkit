import { readFileSync } from "node:fs";
import { relative } from "node:path";
import type { Finding } from "../checks/types";

const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

/** Offset -> line, done once per finding rather than once per match. */
function describe(at: { file: string; offset: number }): string {
  try {
    const source = readFileSync(at.file, "utf8");
    let line = 1;
    for (let i = 0; i < at.offset; i += 1) if (source.charCodeAt(i) === 10) line += 1;
    return `${relative(process.cwd(), at.file)}:${line}`;
  } catch {
    return relative(process.cwd(), at.file);
  }
}

export function reportFindings(findings: Finding[], registeredCount: number): void {
  if (findings.length === 0) {
    console.log(green(`✓ cairn check — ${registeredCount} anchors, all applied, no route conflicts`));
    return;
  }

  console.error(red("\n✗ cairn check failed\n"));

  for (const finding of findings) {
    console.error(`  ${yellow("•")} ${finding.message}  ${dim(`[${finding.rule}]`)}`);
    for (const item of finding.detail ?? []) {
      // `path:line` is what terminals and editors turn into a clickable jump.
      const where = item.at ? dim(`  ${describe(item.at)}`) : "";
      console.error(`      - ${item.text}${where}`);
    }
    if (finding.hint) console.error(dim(`      ${finding.hint}`));
    console.error("");
  }
}
