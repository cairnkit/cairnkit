import type { Finding } from "../checks/types";
import { resolveLocation } from "../location";
import { CLI_NAME } from "../cli-name";

const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

/**
 * Offset -> `path:line`.
 *
 * The resolution itself is shared with the JSON reporter. It used to live here,
 * which meant the machine-readable output would have had to reimplement it and
 * the two could report different lines for the same finding.
 */
function describe(at: { file: string; offset: number }): string {
  const { file, line } = resolveLocation(at);
  return `${file}:${line}`;
}

export function reportFindings(findings: Finding[], registeredCount: number): void {
  if (findings.length === 0) {
    console.log(
      green(`✓ ${CLI_NAME} check · ${registeredCount} anchors, all applied, no route conflicts`),
    );
    return;
  }

  console.error(red(`\n✗ ${CLI_NAME} check failed\n`));

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
