import type { Finding } from "../checks/types";

const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

export function reportFindings(findings: Finding[], registeredCount: number): void {
  if (findings.length === 0) {
    console.log(green(`✓ cairn check — ${registeredCount} anchors, all applied, no route conflicts`));
    return;
  }

  console.error(red("\n✗ cairn check failed\n"));

  for (const finding of findings) {
    console.error(`  ${yellow("•")} ${finding.message}  ${dim(`[${finding.rule}]`)}`);
    for (const line of finding.detail ?? []) console.error(`      - ${line}`);
    if (finding.hint) console.error(dim(`      ${finding.hint}`));
    console.error("");
  }
}
